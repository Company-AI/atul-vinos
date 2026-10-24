# Copias de seguridad

## Qué se guarda y qué no

| | |
|---|---|
| **La base** | Pedidos, pagos, clientes, el catálogo que cargó Maxi, el stock, los cupones y los suscriptores. |
| **Las fotos** | Las que suben desde el panel. Viven en el volumen `uploads` y **no están en git**: si se pierden, hay que volver a sacarlas y subirlas una por una. |
| **El `.env.production`** | Los secretos. Sin `AUTH_SECRET` se caen todas las sesiones; sin las credenciales de Mercado Pago no se cobra. |

El código **no** se respalda: está en GitHub y el servidor lo construye de ahí.

## Cuándo corre

Todos los días a las **00:30 de Argentina** (3:30 UTC). Lo dispara el cron de
root en el servidor:

```
30 3 * * * /opt/atul-vinos/scripts/backup.sh >> /var/log/atul-backup.log 2>&1
```

No hay que instalarlo a mano: **el deploy lo deja puesto**. Instala `rclone` si
falta, crea `/var/backups/atul` y agrega la línea al cron si no está. Es
idempotente, así que correrlo mil veces no cambia nada — y si algún día hay
que rearmar el VPS, sale solo con el primer deploy.

Ese paso va **al final del deploy y no puede voltearlo**. La primera versión
iba antes del chequeo de salud y con `set -e`: el instalador de rclone salió
con código 1 habiendo instalado bien, y se llevó puesto el deploy entero
además de saltear la verificación de que la app había quedado sana. Las
copias importan, pero nunca más que la tienda andando. Si el paso falla, el
deploy sigue y queda marcado en amarillo.

Se guardan **14 días** de dumps.

### Correr uno ahora

```bash
gh workflow run backup.yml --repo Company-AI/atul-vinos
```

Sirve para comprobar que el circuito funciona —sobre todo la subida, que es
la parte que puede fallar en silencio— y para tomarse una copia antes de algo
riesgoso: una migración pesada, una carga masiva. Al terminar lista qué quedó
en el servidor y qué quedó en el bucket. El cron sigue corriendo igual.

## Dónde quedan

1. **En el servidor**, en `/var/backups/atul/`, con permisos 600. Esto protege
   de un error nuestro: una migración mala, un `docker compose down -v`, un bug
   que borra de más.
2. **Afuera**, en Backblaze B2, bucket `atul-vinos`. Esto es lo único que
   protege de perder el servidor entero.

Mientras no haya credenciales de B2, el aviso diario dice `sólo local`. Es a
propósito: que se vea la diferencia.

### Cómo queda organizado el bucket

```
atul-vinos/
  versionado/     los dumps de la base y los .env, uno por día
  fotos/          espejo del estado actual de las fotos
```

Las fotos van como **espejo** y no como copia diaria: un tar por día
multiplicaría por 14 todo el catálogo de imágenes, en el disco y en el bucket.
Lo que se borra o se pisa va a `borrados/<fecha>` en el servidor y se limpia
con la misma retención, así que igual hay 14 días de vuelta atrás.

## Configurar Backblaze

El bucket `atul-vinos` ya existe. Faltan las llaves:

1. Backblaze → **Application Keys** → *Add a New Application Key*
2. Alcance: **sólo el bucket `atul-vinos`**, permiso *Read and Write*
3. Anotar el **keyID** y la **applicationKey** (la segunda se muestra una sola
   vez)
4. Cargarlas como secrets del repo, desde tu máquina:

```bash
gh secret set B2_KEY_ID --repo Company-AI/atul-vinos
gh secret set B2_APP_KEY --repo Company-AI/atul-vinos
gh variable set B2_BUCKET --body "atul-vinos" --repo Company-AI/atul-vinos
```

5. Un deploy, y desde esa noche el aviso pasa a decir `subido a b2:atul-vinos`.

Las llaves nunca se escriben en el servidor: el deploy las pone en el
`.env.production` y el script se las pasa a `rclone` por variables de entorno.

### Avisos

Opcional, un webhook que reciba un JSON con `{"text": "..."}` — sirve Slack,
Discord o cualquier cosa que acepte eso:

```bash
gh secret set BACKUP_WEBHOOK --repo Company-AI/atul-vinos
```

**Avisa siempre, salga bien o mal.** Un backup que dejó de correr no tira
error: simplemente deja de pasar, y uno se entera el día que lo necesita. Si
todos los días llega un mensaje, el silencio también se nota.

### Ojo con el ciclo de vida del bucket

Hoy el bucket está en **"Keep all versions"**. Con eso, cuando la rotación
borra un dump viejo, Backblaze no lo borra: lo guarda como versión oculta,
para siempre, y se paga igual. Conviene pasarlo a *Keep only the last version*
o poner que las versiones viejas se borren a los 30 días, en **Lifecycle
Settings** del bucket.

El script ya sube con `hard_delete`, así que lo que él borra se borra de
verdad; la regla de ciclo de vida es por si quedó algo de antes.

## Si pasa algo

```bash
cd /opt/atul-vinos

./scripts/restore.sh                       # qué copias hay
./scripts/restore.sh 20261024-0030 prueba  # restaurar en una base aparte y mirar
./scripts/restore.sh 20261024-0030         # pisar producción (pide confirmación)
```

**Empezá siempre por `prueba`.** Restaura en una base nueva sin tocar nada y te
dice cuántos pedidos, productos, clientes y suscriptores tiene adentro, para
ver si es la copia que buscabas antes de decidir.

La restauración de verdad, además:

- hace un dump del estado actual **antes** de pisarlo, por si la copia elegida
  era la equivocada;
- baja la app mientras restaura, para que nadie escriba en el medio;
- al terminar, dice qué quedó.

Las fotos no se restauran solas — el script imprime el comando al final.

Si el servidor ya no existe: levantar uno nuevo, bajar la última copia del
bucket con `rclone copy b2:atul-vinos/versionado/… `, poner el
`env-AAAAMMDD-HHMM` como `.env.production` y correr el restore.

## Probarlo

Una copia que nunca restauraste no es una copia.

**Probado el 21 de octubre de 2026**, contra la base de desarrollo: se hizo el
dump (128 KB, 61 tablas), se restauró en una base aparte y volvieron 32
pedidos, 26 productos, 13 clientes y 6 suscriptores.

Falta probarlo contra producción. Conviene hacerlo con el modo `prueba`, que no
toca nada, la primera noche que corra el cron.
