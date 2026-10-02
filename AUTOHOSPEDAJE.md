# Levantar el sitio en un servidor propio

Todo corre en Docker: la base, el sitio y un proxy que resuelve el certificado
HTTPS solo. Probado de punta a punta —imagen construida, migraciones aplicadas,
catálogo cargado y páginas sirviendo— antes de escribir esto.

Hospedarlo acá resuelve dos cosas que en Vercel o Netlify quedaban abiertas:

- **Las fotos que se suben desde el admin.** En serverless el disco se borra en
  cada despliegue y hacía falta contratar un bucket aparte. Acá van a un volumen
  y se quedan.
- **Las conexiones a la base.** Serverless abre una por invocación y agota el
  cupo de Postgres enseguida, por eso se pedía una base "con pooler". Un proceso
  largo abre unas pocas y las reusa.

---

## Lo que hace falta

- Una máquina con **Docker** y **Docker Compose v2** (`docker compose version`).
  Con 2 GB de RAM alcanza; 4 GB van cómodos.
- Un **dominio apuntando a la IP** del servidor, si querés HTTPS.
- Los **puertos 80 y 443 abiertos**. Caddy los usa para sacar y renovar el
  certificado; sin el 80 no puede.

---

## Primera vez

```bash
git clone <el-repo> atul && cd atul
cp .env.server.example .env
```

Abrí `.env` y completá. Las contraseñas no se inventan a mano:

```bash
openssl rand -base64 32
```

Lo mínimo para arrancar es `NEXT_PUBLIC_SITE_URL`, `DOMINIO`,
`POSTGRES_PASSWORD`, `AUTH_SECRET` y `SEED_ADMIN_PASSWORD`. El resto —pagos,
envíos, correo— se puede cargar después sin reconstruir nada, salvo
`NEXT_PUBLIC_SITE_URL`, que se explica más abajo.

Después:

```bash
docker compose up -d --build
```

Eso construye la imagen, levanta Postgres, **aplica las migraciones** y recién
entonces arranca el sitio. El orden está forzado en el compose: no hay manera de
servir contra una base con el esquema viejo por haberse olvidado de un paso.

Para cargar el catálogo inicial, una sola vez:

```bash
docker compose --profile setup run --rm seed
```

> El seed trae el catálogo completo **con pedidos y clientes de ejemplo**. Sirve
> para ver el sitio lleno y probar el panel. Si vas a arrancar con datos reales,
> no lo corras: cargá los vinos desde el admin.

Entrá a tu dominio. El panel está en `/admin`, con el usuario
`admin@atulwines.com` y la contraseña que pusiste en `SEED_ADMIN_PASSWORD`.
**Cambiala desde el panel apenas entres.**

---

## El día a día

```bash
docker compose logs -f app         # ver qué está pasando
docker compose ps                  # qué está levantado
docker compose restart app         # reiniciar sólo el sitio
```

**Publicar cambios:**

```bash
git pull
docker compose up -d --build
```

Las migraciones nuevas se aplican solas en ese mismo comando.

**Una variable que es distinta a las demás:** `NEXT_PUBLIC_SITE_URL` queda
escrita dentro del JavaScript que se le manda al navegador, y eso pasa cuando se
construye la imagen, no al arrancar. Si la cambiás, hay que reconstruir:

```bash
docker compose up -d --build
```

Las demás variables se leen al arrancar: alcanza con `docker compose restart app`.

---

## Copias de seguridad

Son dos cosas separadas y las dos importan: la base y las fotos.

```bash
# La base
docker compose exec -T db pg_dump -U atul atul | gzip > copia-$(date +%F).sql.gz

# Las fotos subidas desde el admin
docker run --rm -v atul_uploads:/datos -v "$PWD":/salida alpine \
  tar czf /salida/fotos-$(date +%F).tar.gz -C /datos .
```

Para restaurar la base en una instalación limpia:

```bash
gunzip -c copia-2026-10-02.sql.gz | docker compose exec -T db psql -U atul atul
```

Poné el primero en un cron diario. Una copia que nadie probó restaurar no es una
copia: hacelo una vez a mano y quedate tranquilo.

---

## Entrar a la base

El puerto de Postgres **no se publica** a propósito: sólo se habla desde adentro
de la red de Docker, así que no queda expuesto a internet.

Para una consulta puntual, desde el servidor:

```bash
docker compose exec db psql -U atul atul
```

Para mirarla con una herramienta visual, Prisma Studio:

```bash
docker compose --profile setup run --rm -p 5555:5555 seed \
  npx prisma studio --hostname 0.0.0.0
```

y entrás por un túnel SSH desde tu computadora:

```bash
ssh -L 5555:localhost:5555 usuario@tu-servidor
```

Con eso, `http://localhost:5555` en tu navegador muestra la base del servidor.

Si preferís tu propio cliente (TablePlus, DBeaver), creá un
`docker-compose.override.yml` al lado del compose:

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"
```

El `127.0.0.1:` adelante no es decorativo: sin eso el puerto queda abierto a
internet. Después, el mismo túnel pero con 5432.

---

## Las direcciones de los webhooks

Cuando conectes los servicios, registrá estas URLs en sus paneles:

| Servicio | Dirección |
|---|---|
| Mercado Pago | `https://TU-DOMINIO/api/webhooks/mercadopago` |
| Envíopack | `https://TU-DOMINIO/api/webhooks/envios/enviopack?secreto=TU-SECRETO` |

El de Envíopack lleva el secreto en la dirección porque ellos no firman sus
llamadas. Tiene que coincidir con `ENVIOPACK_WEBHOOK_SECRET`.

---

## Si algo no levanta

**El sitio no responde y los logs dicen que no puede conectarse a la base.**
Mirá `docker compose ps`: si `db` no está `healthy`, el problema es ahí.
`docker compose logs db` suele decir que falta `POSTGRES_PASSWORD`.

**Caddy no consigue el certificado.** El dominio tiene que resolver a la IP del
servidor *antes* de levantar, y el puerto 80 tiene que estar abierto desde
afuera. Mientras tanto podés poner `DOMINIO=:80` en el `.env` y servir por HTTP
en la IP, sin certificado.

**Las fotos subidas desaparecieron.** Sólo pasa si se borró el volumen
`atul_uploads`. `docker compose down` no lo toca; `docker compose down -v` sí, y
también se lleva la base. Ese comando no se corre salvo que quieras empezar de
cero.

**El build se queda sin memoria.** En una máquina chica, construir la imagen
puede pasarse de RAM. Construila en tu computadora y subí la imagen, o agregale
swap al servidor.
