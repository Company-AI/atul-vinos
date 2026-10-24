#!/bin/bash
# Restaurar una copia. Se corre EN el servidor:
#
#     ./scripts/restore.sh                       # qué copias hay
#     ./scripts/restore.sh 20261024-0030 prueba  # restaurar en una base aparte
#     ./scripts/restore.sh 20261024-0030         # pisar producción (pide confirmación)
#
# Está escrito para no tener que inventar comandos con el sitio caído, que es
# exactamente cuando uno se equivoca.
set -uo pipefail
# El compose y el .env.production viven en deploy/, no en la raíz del repo.
cd "$(dirname "$0")/../deploy"

ENTORNO=".env.production"
DESTINO="${BACKUP_DIR:-/var/backups/atul}"
COMPOSE="docker compose --env-file $ENTORNO"

leer_env() { grep "^$1=" "$ENTORNO" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'; }
USUARIO=$(leer_env POSTGRES_USER); USUARIO="${USUARIO:-atul}"
BASE=$(leer_env POSTGRES_DB);      BASE="${BASE:-atul}"

# Qué hay adentro de una base. Va por heredoc y no con -c '...': dentro de un
# script, bash se come las comillas simples del SQL y la consulta llega rota.
# (Lo descubrí probándolo: psql devolvía «syntax error at or near ":"».)
resumir() {
  local db="$1"
  $COMPOSE exec -T db psql -U "$USUARIO" -d "$db" -t <<'SQL' 2>/dev/null || echo "  (no pude contar; mirá a mano)"
SELECT '  pedidos: '      || (SELECT count(*) FROM "Order")
    || ' · productos: '   || (SELECT count(*) FROM "Product")
    || ' · clientes: '    || (SELECT count(*) FROM "User")
    || ' · suscriptores: '|| (SELECT count(*) FROM "NewsletterSubscriber");
SQL
}

listar() {
  echo "Copias en $DESTINO:"
  ls -1t "$DESTINO"/base-*.sql.gz 2>/dev/null | while read -r f; do
    printf "  %-18s %6s  %s\n" \
      "$(basename "$f" | sed 's/^base-//; s/\.sql\.gz$//')" \
      "$(du -h "$f" | cut -f1)" \
      "$(date -r "$f" '+%d/%m/%Y %H:%M')"
  done
  echo
  echo "Para bajar una de Backblaze:"
  echo "  rclone copy b2:\$B2_BUCKET/versionado/base-FECHA.sql.gz $DESTINO/"
}

FECHA="${1:-}"
MODO="${2:-produccion}"

[ -z "$FECHA" ] && { listar; exit 0; }

ARCHIVO="$DESTINO/base-$FECHA.sql.gz"
[ -f "$ARCHIVO" ] || { echo "No existe $ARCHIVO"; echo; listar; exit 1; }

# Un dump cortado restaurado sobre producción es peor que no restaurar nada.
TABLAS=$(gzip -dc "$ARCHIVO" | grep -c 'CREATE TABLE' || true)
echo "Copia $FECHA · $(du -h "$ARCHIVO" | cut -f1) · $TABLAS tablas"
[ "$TABLAS" -lt 10 ] && { echo "ERROR: esa copia tiene $TABLAS tablas, no parece completa."; exit 1; }

if [ "$MODO" = "prueba" ]; then
  # Empezá siempre por acá: restaura en una base nueva sin tocar nada, para ver
  # qué hay adentro antes de decidir.
  PRUEBA="${BASE}_prueba_$FECHA"
  echo "Restaurando en la base aparte \"$PRUEBA\" (no se toca producción)…"
  $COMPOSE exec -T db psql -U "$USUARIO" -d postgres -c "DROP DATABASE IF EXISTS \"$PRUEBA\";" >/dev/null
  $COMPOSE exec -T db psql -U "$USUARIO" -d postgres -c "CREATE DATABASE \"$PRUEBA\";" >/dev/null
  gzip -dc "$ARCHIVO" | $COMPOSE exec -T db psql -U "$USUARIO" -d "$PRUEBA" >/dev/null 2>&1

  echo
  echo "Qué quedó adentro:"
  resumir "$PRUEBA"
  echo
  echo "Para borrarla cuando termines de mirar:"
  echo "  $COMPOSE exec -T db psql -U $USUARIO -d postgres -c 'DROP DATABASE \"$PRUEBA\";'"
  exit 0
fi

echo
echo "⚠️  Esto PISA la base de producción con la copia del $FECHA."
read -r -p "Escribí 'si' para seguir: " ok
[ "$ok" = "si" ] || { echo "Cancelado."; exit 1; }

# Antes de pisar nada, una copia del estado actual: si la elegida era la
# equivocada, esto es lo único que permite volver.
RESGUARDO="$DESTINO/antes-de-restaurar-$(date +%Y%m%d-%H%M).sql.gz"
echo "Guardando el estado actual en $RESGUARDO…"
$COMPOSE exec -T db pg_dump -U "$USUARIO" -d "$BASE" --clean --if-exists | gzip > "$RESGUARDO" \
  || { echo "ERROR: no pude resguardar el estado actual. No sigo."; exit 1; }

# Se baja la app para que nadie escriba en el medio de la restauración.
echo "Bajando la app…"
$COMPOSE stop app >/dev/null

echo "Restaurando…"
gzip -dc "$ARCHIVO" | $COMPOSE exec -T db psql -U "$USUARIO" -d "$BASE" >/dev/null 2>&1

echo "Levantando la app…"
$COMPOSE start app >/dev/null
sleep 5

echo
echo "Listo. Estado:"
resumir "$BASE"
echo
echo "Las fotos NO se restauran solas. Si también hace falta:"
echo "  rsync -a $DESTINO/archivos/ \"\$(docker inspect \$($COMPOSE ps -q app) --format '{{range .Mounts}}{{if eq .Destination \"/app/public/uploads\"}}{{.Source}}{{end}}{{end}}')/\""
echo
echo "Si esta copia era la equivocada, el estado anterior quedó en:"
echo "  $RESGUARDO"
