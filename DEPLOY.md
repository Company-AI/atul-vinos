# Deploy

Probado contra Netlify con `@netlify/plugin-nextjs`. Sirve igual para Vercel:
lo único que cambia es dónde se cargan las variables.

## 1. Base de datos

Netlify no provee Postgres: hay que contratarlo aparte. **Con pooler**, no sin.
Cada invocación serverless abre su propia conexión y Postgres se queda sin cupo
enseguida.

- **Neon** trae pooler propio y es el camino más corto.
- **Supabase** también sirve (usar el puerto del pooler, no el directo).

Después de crear la base, correr las migraciones una vez desde tu máquina
apuntando a la base de producción:

```bash
DATABASE_URL="<url-de-produccion>" npx prisma migrate deploy
```

El seed es opcional y **carga datos demo**: no correrlo en producción salvo que
quieras el catálogo de prueba.

## 2. Archivos subidos

`STORAGE_DRIVER=local` escribe con `mkdir`/`writeFile`, y en serverless el
filesystem es efímero: las fotos que subas desde el admin desaparecen en el
próximo deploy.

En producción va `STORAGE_DRIVER=s3`. El adaptador ya está escrito; sirve
cualquier compatible con S3 (AWS S3, Cloudflare R2, Backblaze B2).

## 3. Variables de entorno

Se cargan en el panel del proveedor, nunca en `netlify.toml` (ese archivo se
commitea).

### Obligatorias

| Variable | Notas |
|---|---|
| `DATABASE_URL` | La URL **con pooler**. |
| `AUTH_SECRET` | Generar con `openssl rand -base64 32`. Si cambia, se invalidan todas las sesiones. |
| `NEXT_PUBLIC_SITE_URL` | El dominio final, con https y sin barra al final. |

### Pagos (sin esto el checkout usa el proveedor mock)

| Variable | Notas |
|---|---|
| `MP_ACCESS_TOKEN` | Credencial de producción de Mercado Pago. |
| `MP_PUBLIC_KEY` | |
| `MP_WEBHOOK_SECRET` | Firma del webhook. Sin esto no se valida el origen. |

El webhook queda en `https://<dominio>/api/webhooks/mercadopago` y hay que
registrarlo en el panel de Mercado Pago. **El pago se confirma sólo por
webhook**, nunca por el redirect del navegador.

### Archivos

| Variable | Notas |
|---|---|
| `STORAGE_DRIVER` | `s3` en producción. |
| `S3_ENDPOINT` `S3_REGION` `S3_BUCKET` | |
| `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | |
| `S3_PUBLIC_URL` | Base pública del bucket. Se agrega sola a `images.remotePatterns`. |

### Mail y varios

`SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `EMAIL_FROM` para las
notificaciones, `SHIPPING_DEFAULT_PROVIDER` y `CRON_SECRET` si se usan tareas
programadas.

## 4. Antes del primer deploy

- [ ] Cambiar la contraseña del staff. La del seed es `Aurora2026!` y está en
      el repo: no puede quedar en un admin público.
- [ ] Confirmar que `AUTH_SECRET` no es el del ejemplo.
- [ ] `STORAGE_DRIVER=s3` con el bucket andando.
- [ ] Registrar el webhook de Mercado Pago.

## Notas de plataforma

**Prisma en serverless.** `schema.prisma` declara
`binaryTargets = ["native", "rhel-openssl-3.0.x"]`: el segundo es el motor que
necesitan las funciones sobre AWS Lambda. Sin él el build pasa y Prisma explota
en el primer query. El `postinstall` corre `prisma generate`.

**Nada se prerenderiza contra la base.** El admin y las rutas de diseño van
`force-dynamic`, y las páginas públicas resultan dinámicas porque el layout lee
cookies (carrito y sesión). El build cierra sin `DATABASE_URL`; en runtime es
obligatoria.

**El export a Excel** corre en una función con límite de 10 s. Con pocos
pedidos anda; a volumen hay que moverlo a background o escribir el archivo a un
bucket.

**Las rutas `/v2` a `/v8`** son direcciones de diseño internas, marcadas
`noindex`. Cuando se elija una, se borran junto con `/v5` y su redirect.
