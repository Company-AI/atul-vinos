# Bodega Aurora — plataforma

Sitio institucional premium, e-commerce de vinos y Club de suscripción mensual,
con un back-office para operar el negocio completo. Monolito modular en
Next.js 15 + TypeScript + PostgreSQL.

> La marca «Bodega Aurora» y todo su contenido son datos semilla: nombre, logo,
> textos, fotos, precios, planes y costos de envío se editan desde el admin.

---

## Arranque rápido

```bash
npm install
cp .env.example .env          # ajustá DATABASE_URL y AUTH_SECRET
createdb bodega_dev
npm run db:migrate            # crea el esquema
npm run assets:stock          # descarga la media de demostración
npm run db:seed               # datos de prueba completos
npm run dev
```

El sitio queda en `http://localhost:3021`.

### Accesos del seed

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | `admin@bodegaaurora.test` | `Aurora2026!` |
| Depósito | `deposito@bodegaaurora.test` | `Aurora2026!` |
| Atención al cliente | `atencion@bodegaaurora.test` | `Aurora2026!` |
| Cliente | `juan.perez@example.com` | `Cliente2026!` |

---

## Probar el flujo completo sin credenciales

Sin `MP_ACCESS_TOKEN`, el sistema usa un **simulador de pagos** que dispara
exactamente el mismo webhook que Mercado Pago en producción. Con eso se pueden
recorrer de punta a punta los casos de la spec:

**Compra en la tienda.** Agregá vinos → `/checkout` → «Confirmar y pagar» →
elegí «Aprobar el pago». El webhook marca el pedido como pagado, reserva stock y
lo deja visible en `/admin/picking`. Desde ahí se prepara, se imprime la
etiqueta y se despacha.

**Alta al Club.** `/club` → elegí un plan → «Autorizar el débito mensual» →
«Aprobar». Se crean la suscripción, su primer ciclo y el pedido del box, con el
stock reservado y el pedido en «A preparar».

**Cobro rechazado.** En el simulador elegí «Rechazar»: el ciclo queda en pago
fallido, no se genera pedido y aparece en `/admin/pagos` para recuperarlo.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3021) |
| `npm run build` | Build de producción |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest, base `bodega_test`) |
| `npm run db:migrate` | Aplica migraciones en desarrollo |
| `npm run db:seed` | Recarga los datos de demostración |
| `npm run db:reset` | Borra y recrea la base con el seed |
| `npm run db:studio` | Prisma Studio |
| `npm run assets:stock` | Descarga fotos y videos de demostración |

---

## Cómo está organizado

```
src/
  app/          rutas: (public) (shop) (account) (checkout) (auth) admin api
  domain/       reglas de negocio — no conoce Next ni Prisma directo en la UI
  infra/        Prisma, pagos, envíos, notificaciones, storage, auth, etiquetas
  ui/           primitivas del design system
  components/   componentes de producto (site, shop, club, account, admin)
  lib/          utilidades (dinero en centavos, fechas, slugs, cn)
prisma/         schema, migraciones y seed
tests/          Vitest contra una base de test real
docs/           DESIGN_SYSTEM.md · ASSETS.md
```

Reglas de dependencia: `app → domain → infra`, nunca al revés. Todo proveedor
externo entra por una interface (`PaymentProvider`, `ShippingProvider`,
`NotificationChannel`, `StorageProvider`), lo que permite empezar con un
proveedor interno y cambiarlo sin tocar el dominio.

La arquitectura completa, el modelo de datos y los flujos están en
[`PROJECT_PLAN.md`](PROJECT_PLAN.md).

---

## Decisiones que conviene conocer

**El pago lo confirma el webhook, nunca el navegador.** El redirect solo muestra
el estado leído de la base. Cada evento se guarda con su payload y se procesa
una sola vez (`provider` + `eventId` únicos); si algo falla, queda reprocesable
desde `/admin/pagos`.

**Suscripción ≠ pedido.** `Subscription` es el contrato, `SubscriptionCycle` el
período cobrado y `Order` el envío físico. Una renovación agrega un ciclo y un
pedido: nunca crea otra suscripción.

**Los pedidos guardan un snapshot.** Productos, precios, dirección, plan y
beneficios se congelan al generarse. Cambiar el box de septiembre no altera el
pedido de agosto.

**El stock no se edita, se mueve.** Toda variación pasa por
`recordMovement`, que registra el valor anterior y posterior, el motivo y el
responsable, con bloqueo de fila para que dos pedidos simultáneos no sobrevendan.
`disponible = físico − reservado`.

**Los packs no tienen stock propio.** Su disponibilidad se deriva del componente
más escaso; si falta uno, el pack deja de venderse solo.

**El dinero se calcula en centavos enteros**, en un único motor de precios que
comparten el carrito, el checkout y el pedido.

---

## Integraciones

| Integración | Estado |
|---|---|
| Mercado Pago | Checkout Pro, suscripciones (preapproval) y webhooks con verificación de firma |
| Simulador de pagos | Activo cuando no hay credenciales y fuera de producción |
| Logística propia | Cotización por zonas, tracking y etiquetas: operativa |
| Andreani · OCA · Correo Argentino | Contrato definido, pendientes de credenciales |
| Email | SMTP con plantillas branded; sin SMTP escribe a consola |
| WhatsApp | Canal preparado, pendiente de proveedor |
| Storage | Local en desarrollo, S3-compatible preparado |

Las credenciales se cargan por variables de entorno (`.env.example` las lista) y
nunca se guardan en la base ni llegan al navegador.

---

## Etiquetas de envío

Desde el detalle de un pedido o en lote desde la lista:

- **Térmica 100×150 mm**, una etiqueta por página.
- **A4**, cuatro por hoja.

Cada etiqueta lleva remitente, destinatario, CP destacado, cantidad de botellas,
peso, aviso de frágil, código QR al seguimiento y Code128 con el tracking, todo
generado en el servidor como SVG inline (no depende de la red al imprimir).

---

## Tests

71 casos sobre la lógica que no puede fallar: disponibilidad y packs,
movimientos de stock, motor de precios, cupones, creación de pedido, webhooks
duplicados y los seis casos de aceptación de la spec (compra, alta al Club,
renovación, cobro rechazado y recuperado, baja, y cambio del box del mes).

```bash
createdb bodega_test
DATABASE_URL="postgresql://usuario@localhost:5432/bodega_test" npx prisma migrate deploy
npm test
```

---

## Antes de salir a producción

- [ ] Cargar `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`, y registrar el endpoint
      `/api/webhooks/mercadopago` en el panel de Mercado Pago
- [ ] Generar un `AUTH_SECRET` real (32 bytes aleatorios)
- [ ] Configurar SMTP y verificar el dominio remitente
- [ ] Pasar el storage a S3/R2 y mover la media pesada fuera del repo
- [ ] Reemplazar la fotografía y el video de demostración (ver [`docs/ASSETS.md`](docs/ASSETS.md))
- [ ] Revisar textos legales con un asesor
- [ ] Cargar el catálogo real y los costos de envío por zona
- [ ] Cambiar las contraseñas del seed y crear los usuarios reales del equipo
