#!/bin/bash
# Copia de seguridad diaria. Se corre EN el servidor:
#
#     /opt/atul-vinos/deploy/scripts/backup.sh
#
# Guarda las tres cosas que no se pueden volver a generar:
#
#   - la base: pedidos, pagos, clientes, catálogo, stock, suscriptores;
#   - las fotos que subió Maxi, que NO están en git;
#   - el .env.production, con los secretos.
#
# El código no se respalda: está en GitHub y el servidor lo construye de ahí.
#
# ⚠️ Las copias locales protegen de un error nuestro —una migración mala, un
# `down -v`, un bug que borra de más— pero NO de perder el servidor, porque
# viven en el mismo disco. Para eso están las que se suben a Backblaze.
set -uo pipefail
# El compose y el .env.production viven en deploy/, no en la raíz del repo.
cd "$(dirname "$0")/../deploy"

ENTORNO=".env.production"
DESTINO="${BACKUP_DIR:-/var/backups/atul}"
RETENER_DIAS="${BACKUP_KEEP_DAYS:-14}"
FECHA=$(date +%Y%m%d-%H%M)
COMPOSE="docker compose --env-file $ENTORNO"

# Mínimo de tablas que tiene que traer el dump. El schema declara 60 modelos;
# el piso es holgado a propósito para no romper cada vez que se agrega uno,
# pero ataja el caso real: un dump cortado o contra una base vacía.
TABLAS_MINIMAS="${BACKUP_MIN_TABLAS:-40}"

leer_env() { grep "^$1=" "$ENTORNO" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'; }

# Un backup que deja de correr no da error: deja de pasar, que es peor. Por eso
# se avisa SIEMPRE, salga bien o mal, y el silencio también se nota.
avisar() {
  local nivel="$1" texto="$2"
  local url; url=$(leer_env BACKUP_WEBHOOK)
  [ -z "$url" ] && return 0
  local icono="🟢"; [ "$nivel" = "error" ] && icono="🔴"
  curl -sS -m 10 -X POST -H 'content-type: application/json' \
    --data "$(printf '{"text":"%s Atul Vinos · %s"}' "$icono" "$texto")" \
    "$url" >/dev/null 2>&1 || true
}

morir() {
  echo "ERROR: $1" >&2
  avisar error "Falló el backup: $1"
  exit 1
}

[ -f "$ENTORNO" ] || morir "no encuentro $ENTORNO; ¿el script corre desde /opt/atul-vinos/deploy?"

mkdir -p "$DESTINO" && chmod 700 "$DESTINO"

USUARIO=$(leer_env POSTGRES_USER); USUARIO="${USUARIO:-atul}"
BASE=$(leer_env POSTGRES_DB);      BASE="${BASE:-atul}"

echo "── $(date -Is) ──"

# ── 1. La base ───────────────────────────────────────────────────────────────
# --clean --if-exists para que el dump se pueda restaurar sobre una base que ya
# tiene cosas, que es el caso normal cuando hay que volver atrás.
$COMPOSE exec -T db pg_dump -U "$USUARIO" -d "$BASE" --clean --if-exists \
  | gzip > "$DESTINO/base-$FECHA.sql.gz" || morir "pg_dump no pudo leer la base"

# Un dump vacío o cortado es peor que ninguno: se verifica ANTES de rotar, para
# no borrar una copia buena y quedarse con una inservible.
TABLAS=$(gzip -dc "$DESTINO/base-$FECHA.sql.gz" | grep -c 'CREATE TABLE' || true)
if [ "$TABLAS" -lt "$TABLAS_MINIMAS" ]; then
  rm -f "$DESTINO/base-$FECHA.sql.gz"
  morir "el dump salió con $TABLAS tablas y esperábamos al menos $TABLAS_MINIMAS: se descartó y no se rotó nada"
fi

# ── 2. Las fotos ─────────────────────────────────────────────────────────────
# El volumen se resuelve preguntándole al contenedor dónde está montado, en vez
# de adivinar el nombre: Docker le pone el prefijo del directorio del proyecto
# y eso cambia si alguien mueve la carpeta.
CONTENEDOR=$($COMPOSE ps -q app 2>/dev/null)
VOLUMEN=""
if [ -n "$CONTENEDOR" ]; then
  VOLUMEN=$(docker inspect "$CONTENEDOR" \
    --format '{{range .Mounts}}{{if eq .Destination "/app/public/uploads"}}{{.Source}}{{end}}{{end}}' 2>/dev/null)
fi
[ -n "$VOLUMEN" ] || morir "no pude ubicar el volumen de uploads; ¿está levantado el servicio app?"

# Espejo y no una copia nueva por día. Un tar diario multiplicaría por 14 todas
# las fotos del catálogo. Lo que se borra o se pisa no se pierde: va a
# `borrados/<fecha>` y se limpia con la misma retención.
mkdir -p "$DESTINO/archivos" "$DESTINO/borrados/$FECHA"
rsync -a --delete --backup --backup-dir="$DESTINO/borrados/$FECHA" \
  "$VOLUMEN/" "$DESTINO/archivos/" || morir "no se pudo espejar el volumen de fotos"
rmdir "$DESTINO/borrados/$FECHA" 2>/dev/null || true
FOTOS=$(du -sh "$DESTINO/archivos" | cut -f1)

# ── 3. Los secretos ──────────────────────────────────────────────────────────
cp "$ENTORNO" "$DESTINO/env-$FECHA"

chmod 600 "$DESTINO"/*.gz "$DESTINO"/env-* 2>/dev/null || true
chmod -R go-rwx "$DESTINO/archivos" "$DESTINO/borrados" 2>/dev/null || true

# La retención alcanza sólo a lo versionado. El espejo de fotos es el estado
# actual y no se toca.
find "$DESTINO" -maxdepth 1 -type f -mtime "+$RETENER_DIAS" -delete
find "$DESTINO/borrados" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENER_DIAS" -exec rm -rf {} + 2>/dev/null || true

PESO=$(du -h "$DESTINO/base-$FECHA.sql.gz" | cut -f1)
COPIAS=$(ls "$DESTINO"/base-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo "base:     $PESO  ($TABLAS tablas)"
echo "fotos:    $FOTOS (espejo)"
echo "guardadas: $COPIAS copias, $(du -sh "$DESTINO" | cut -f1) en total"

# ── 4. Afuera: Backblaze B2 ──────────────────────────────────────────────────
# Es lo único que protege de perder el servidor entero. Las credenciales salen
# del .env.production y se le pasan a rclone por variables de entorno, así no
# queda un archivo de configuración con las llaves en el disco.
B2_KEY_ID=$(leer_env B2_KEY_ID)
B2_APP_KEY=$(leer_env B2_APP_KEY)
B2_BUCKET=$(leer_env B2_BUCKET)

AFUERA="sólo local"
if [ -n "$B2_KEY_ID" ] && [ -n "$B2_APP_KEY" ] && [ -n "$B2_BUCKET" ]; then
  command -v rclone >/dev/null || morir "hay credenciales de Backblaze pero rclone no está instalado"

  export RCLONE_CONFIG_B2_TYPE=b2
  export RCLONE_CONFIG_B2_ACCOUNT="$B2_KEY_ID"
  export RCLONE_CONFIG_B2_KEY="$B2_APP_KEY"
  export RCLONE_CONFIG_B2_HARD_DELETE=true

  # Los dumps son archivos nuevos cada día: copy, y sólo los recientes.
  # Las fotos son un espejo: sync, así el bucket ocupa lo mismo que el disco.
  rclone copy "$DESTINO" "b2:$B2_BUCKET/versionado" \
    --max-age 25h --exclude "archivos/**" --exclude "borrados/**" --quiet \
    || morir "las copias quedaron en el servidor: rclone no pudo subir los dumps a $B2_BUCKET"
  rclone sync "$DESTINO/archivos" "b2:$B2_BUCKET/fotos" --quiet \
    || morir "los dumps subieron pero las fotos no"

  AFUERA="subido a b2:$B2_BUCKET"
  echo "$AFUERA"
fi

avisar info "Backup del día · base $PESO · $TABLAS tablas · fotos $FOTOS · $AFUERA · $COPIAS dumps guardados"
