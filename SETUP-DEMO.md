# Poner el sitio online para mostrárselo a un cliente

Objetivo: que se vea el diseño completo y navegable, sin montar la operación
real. **Dos variables y dos comandos.**

Pagos, mails y subida de archivos no hacen falta: el checkout usa un simulador
propio y las fotos ya viajan en el repo.

---

## 1. La base de datos (gratis)

Netlify no incluye base, hay que traerla de afuera. Neon tiene plan gratis y
pooler propio, que es lo que necesitan las funciones serverless.

1. Entrá a **neon.tech** y creá una cuenta.
2. Creá un proyecto. Elegí la región más cercana (por ejemplo `aws-sa-east-1`,
   São Paulo).
3. Buscá la cadena de conexión del proyecto y **copiá la que dice *pooled* o
   *pooler***, no la directa. Se reconoce porque el host lleva `-pooler`:

   ```
   postgresql://usuario:clave@ep-algo-123-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

   Si copiás la directa el sitio va a andar y de golpe empezar a dar errores de
   conexión cuando entren varias personas a la vez.

---

## 2. Las dos variables en Netlify

En tu sitio: **Site configuration → Environment variables → Add a variable**.

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | La cadena *pooled* del paso anterior, entre comillas no, tal cual. |
| `AUTH_SECRET` | Cualquier cadena aleatoria larga. Generala con `openssl rand -base64 32`. |

Eso es todo. No cargues las de Mercado Pago, SMTP ni S3: sin ellas el sitio
funciona igual y el checkout usa el simulador.

---

## 3. Crear las tablas y cargar el contenido

Desde tu máquina, en la carpeta del proyecto. Reemplazá `<URL>` por la misma
cadena del paso 1 y elegí tu propia clave de admin:

```bash
DATABASE_URL="<URL>" npx prisma migrate deploy
```

```bash
DATABASE_URL="<URL>" SEED_ADMIN_PASSWORD="la-que-elijas" npm run db:seed
```

El segundo comando carga el catálogo de demo, los textos, los planes del Club y
las cuentas de staff. Tarda un minuto.

> **Elegí una clave propia.** Si omitís `SEED_ADMIN_PASSWORD` queda la del
> repositorio, que es público: cualquiera podría entrar a tu admin.

---

## 4. Redeploy

En Netlify: **Deploys → Trigger deploy → Deploy site**. Hace falta porque las
variables nuevas no se aplican al deploy anterior.

---

## Listo

- El sitio, con las cinco direcciones de diseño en `/v2`, `/v3`, `/v4`, `/v6`,
  `/v7` y `/v8`.
- Carrito y checkout navegables de punta a punta con el simulador de pago.
- Admin en `/admin` con `admin@atulwines.com` y la clave que elegiste. Sirve
  para editar textos **en vivo delante del cliente**, desde
  `/admin/contenido`.

## Antes de mostrarlo

- [ ] La barra de comparación de variantes se ve en `/v2` a `/v8`. Si no querés
      que el cliente la vea, mostrale directamente `/`.
- [ ] `/admin` queda accesible con la URL: si el link circula, conviene una
      clave larga.

## Lo que NO va a funcionar, y está bien

- **Cobros reales**: el checkout usa el simulador. El recorrido se ve completo.
- **Mails**: quedan registrados en la base, no se envían.
- **Subir fotos desde el admin**: el driver de archivos está sin implementar.
  Cargá las fotos por URL. Las del catálogo de demo ya están en el repo.
