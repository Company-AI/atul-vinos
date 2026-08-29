# PROJECT_PLAN.md — Plataforma Bodega Premium

> Sitio institucional + E-commerce de vinos + Club de suscripción mensual + Back-office
> operativo completo, en un monolito modular Next.js.

Marca de referencia en los datos semilla: **Bodega Aurora** (100% editable desde
`Admin > Configuración` y `Admin > Contenido`; nada de branding, textos, precios,
planes, videos o costos de envío está hardcodeado).

---

## 1. Objetivo del producto

Tres productos en una sola base de código, con una única fuente de verdad de datos:

| Producto | Audiencia | Rutas |
|---|---|---|
| Sitio institucional premium | visitante | `/`, `/historia`, `/historias`, `/contacto` |
| E-commerce | comprador | `/vinos`, `/vinos/[slug]`, `/carrito`, `/checkout` |
| Club de suscripción | socio | `/club`, `/mi-cuenta/*` |
| Back-office | operación | `/admin/*` |

Criterio rector de UX pública: **primero el criterio, después la tienda**. Lo que
diferencia a un distribuidor de un supermercado es por qué eligió cada botella, así
que eso va adelante. La conversión existe pero nunca a costa de popups agresivos.

---

## 2. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC) + TypeScript estricto | SSR/ISR para SEO, server actions para mutaciones, un solo deploy |
| UI | Tailwind CSS v4 (CSS-first `@theme`) + Radix primitives + Framer Motion | design tokens en CSS, accesibilidad real, animación con criterio |
| DB | PostgreSQL 15+ | transacciones serias, `numeric` para dinero, JSONB para snapshots |
| ORM | Prisma | migraciones versionadas, tipos generados, transacciones interactivas |
| Auth | Sesión propia: JWT firmado con `jose` en cookie `httpOnly` + `bcryptjs` | control total sobre roles/permisos admin vs cliente |
| Pagos | Adapter `PaymentProvider` → Mercado Pago (Checkout Pro + Preapproval) | desacoplado, testeable, reemplazable |
| Envíos | Adapter `ShippingProvider` → Mock incluido; Andreani/OCA/Correo preparados | sin credenciales hoy, sin refactor mañana |
| Notificaciones | Adapter `NotificationChannel` → Email (SMTP/Resend) + WhatsApp preparado | eventos de dominio → canales |
| Jobs | Cola en Postgres (`jobs` + worker `tsx`), interfaz `JobQueue` | cero infra extra para arrancar; Redis/BullMQ es swap de adapter |
| Storage | Adapter `StorageProvider` → local FS en dev, S3-compatible en prod | imágenes/videos fuera del bundle |
| Tests | Vitest | foco en lógica crítica de dominio |

**No sobreingeniería:** un monolito modular, no microservicios. La separación por
dominios (`src/domain/*`) permite extraer servicios más adelante sin reescribir.

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRESENTACIÓN                                                        │
│  app/(public)  · app/(shop)  · app/(account)  · app/admin            │
│  React Server Components + Client Components + Server Actions        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  (nunca habla con Prisma directo)
┌───────────────────────────────▼──────────────────────────────────────┐
│  DOMINIO  src/domain/*                                               │
│  catalog · inventory · cart · orders · payments · subscriptions       │
│  shipping · promotions · cms · notifications · reports · audit        │
│  Reglas de negocio puras + servicios transaccionales                 │
└───────────────────────────────┬──────────────────────────────────────┘
┌───────────────────────────────▼──────────────────────────────────────┐
│  INFRAESTRUCTURA  src/infra/*                                        │
│  db (Prisma) · payments/mercadopago · shipping/{mock,andreani,...}    │
│  notifications/{email,whatsapp} · storage/{local,s3} · jobs · labels  │
└──────────────────────────────────────────────────────────────────────┘
```

Reglas de dependencia:

1. `app/**` → `domain/**` → `infra/**`. Nunca al revés.
2. Todo proveedor externo entra por una **interface** en `domain/<x>/ports.ts`.
3. Las mutaciones críticas viven en un servicio de dominio con `prisma.$transaction`,
   nunca dispersas en un componente o handler.
4. Los componentes de UI no calculan precios, descuentos ni stock: leen DTOs ya
   resueltos por el dominio.

### Estructura de carpetas

```
src/
  app/
    (public)/          home, historia, historias, contacto, club, legales
    (shop)/            vinos, vinos/[slug], carrito, checkout, checkout/estado
    (account)/mi-cuenta/  inicio, pedidos, suscripcion, direcciones, datos, favoritos
    admin/             dashboard, pedidos, picking, productos, stock, suscripciones,
                       box-del-mes, clientes, cupones, contenido, envios, reportes,
                       auditoria, usuarios, configuracion
    api/
      webhooks/mercadopago/   ingesta de webhooks (idempotente)
      webhooks/shipping/      callbacks de tracking
      admin/export/           CSV / XLSX
      labels/                 render de etiquetas
      cron/                   disparadores de jobs
  domain/
    catalog/ inventory/ cart/ orders/ payments/ subscriptions/ shipping/
    promotions/ cms/ notifications/ customers/ reports/ audit/ settings/
  infra/
    db/ payments/ shipping/ notifications/ storage/ jobs/ labels/ auth/
  ui/                  design system: primitives + components
  lib/                 utils compartidos (money, slug, dates, format, result)
prisma/
  schema.prisma  migrations/  seed.ts
tests/
docs/
```

---

## 4. Modelo de datos

Convenciones: `id` cuid, `createdAt/updatedAt`, dinero en `Decimal(12,2)` (ARS),
borrado lógico donde importa el historial, snapshots en JSONB.

### Identidad y acceso
| Entidad | Notas |
|---|---|
| `User` | cliente y/o staff. `passwordHash`, `emailVerifiedAt`, `role` |
| `Role`, `Permission`, `RolePermission` | SUPER_ADMIN · ADMIN · DEPOSITO · ATENCION_CLIENTE, permisos configurables |
| `Address` | múltiples por usuario, `isDefaultShipping/Billing` |
| `AuditLog` | actor, acción, entidad, `before`/`after` JSONB, IP, fecha |
| `Session` | opcional: revocación de sesiones |

### Catálogo
| Entidad | Notas |
|---|---|
| `Product` | vino **o** pack (`kind: WINE \| PACK`), ficha enológica completa, SEO, flags `featured/isNew/bestSeller` |
| `ProductImage` | orden, `isPrimary`, alt, variantes optimizadas |
| `ProductVideo` | opcional por producto |
| `PackItem` | composición de un pack: `packId`, `componentId`, `quantity` |
| `Category`, `Winery`, `Region`, `GrapeVariety`, `WineLine` | taxonomías administrables |
| `ProductTag` | etiquetas libres (Orgánico, Alta Gama, Novedad…) |
| `Award` | premios/reconocimientos por producto |

### Inventario
| Entidad | Notas |
|---|---|
| `Inventory` | 1-1 con producto vino: `onHand`, `reserved`, `minStock`, `location`; `available = onHand - reserved` |
| `InventoryMovement` | ENTRADA·VENTA·RESERVA·LIBERACION·AJUSTE·DEVOLUCION·ROTURA·MERMA·SUSCRIPCION; guarda `before`/`after`, pedido y usuario responsable |
| `InventoryAllocation` | reserva nominal por `orderId` o por `subscriptionBox` (reserva anticipada del Club) |

Los packs **no** tienen stock propio: su disponibilidad se deriva de
`min(floor(available(componente) / cantidad))`.

### Ventas
| Entidad | Notas |
|---|---|
| `Cart`, `CartItem` | persistente por cookie anónima y por usuario; merge al login |
| `Order` | `number` legible, `type: STORE \| SUBSCRIPTION`, estado, totales, `shippingSnapshot`/`billingSnapshot` JSONB |
| `OrderItem` | snapshot de nombre, SKU, precio unitario, e items expandidos del pack |
| `OrderEvent` | timeline auditable de cada cambio de estado |
| `Payment` | provider, `externalId`, estado, monto, `rawPayload`, `idempotencyKey` |
| `Shipment` | transportista, tracking, URL, estado, fechas de despacho/entrega |
| `ShippingLabel` | formato (A4 / TERMICA_100x150), payload, PDF/HTML generado, reimpresiones |
| `WebhookEvent` | `provider`, `eventId` único, payload, estado, intentos, error, fechas |

### Club
| Entidad | Notas |
|---|---|
| `SubscriptionPlan` | precio, frecuencia, botellas, beneficios, envío, trial, descuento inicial, orden, destacado, activo |
| `Subscription` | **el contrato**: usuario, plan, estado, `nextChargeAt`, `lastChargeAt`, `cyclesCount`, `externalId`, dirección de envío |
| `SubscriptionCycle` | **el período**: mes/año, monto, estado de pago, `paymentId`, `orderId`, `skipped` |
| `SubscriptionBox` | el box de un plan para un mes/año, con costo y valor comercial |
| `SubscriptionBoxItem` | productos y cantidades del box |
| `SubscriptionEvent` | timeline: alta, pago, pausa, cambio de plan, baja |
| `ClubBenefit` | beneficios configurables (descuento tienda, envío gratis, acceso anticipado…) |

Separación obligatoria: `Subscription` (contrato) ≠ `SubscriptionCycle` (período) ≠
`Order` (envío físico). Una suscripción de 12 meses = 1 `Subscription` + 12
`SubscriptionCycle` + hasta 12 `Order`.

### Promociones y contenido
`Coupon`, `CouponUsage`, `Banner`, `CmsSection` (bloques tipados y validados con Zod,
no page-builder libre), `Post` (blog `/historias`), `Faq`, `NewsletterSubscriber`,
`Favorite`, `Notification`, `NotificationLog`, `ShippingZone`, `ShippingRate`,
`Setting` (clave/valor tipado por grupo), `Job`.

---

## 5. Rutas

### Público
```
/                         Home cinematográfica (hero video + storytelling)
/vinos                    Grid + filtros (tipo, varietal, región, bodega, precio,
                          cosecha, intensidad, maridaje) + orden
/vinos/[slug]             Detalle editorial + ficha técnica + relacionados
/packs                    Vista filtrada de packs
/club                     Landing del Club + planes + cómo funciona
/club/suscribirse/[plan]  Alta de suscripción
/historia                 Marca, tierra, elaboración
/historias                Blog editorial
/historias/[slug]         Artículo
/buscar                   Buscador global
/carrito                  Carrito completo (además del drawer)
/checkout                 Checkout de 3 pasos
/checkout/estado/[order]  Resultado real (leído de DB, no del redirect)
/contacto  /faq  /envios  /cambios-y-devoluciones  /terminos  /privacidad
```

### Cuenta (requiere login)
```
/mi-cuenta                Resumen
/mi-cuenta/pedidos        Historial + detalle + tracking
/mi-cuenta/suscripcion    Estado, próximo cobro, próxima selección, pausar/
                          reactivar/cancelar/cambiar plan/omitir mes
/mi-cuenta/direcciones  /mi-cuenta/datos  /mi-cuenta/pagos  /mi-cuenta/favoritos
/mi-cuenta/beneficios
```

### Admin (requiere permiso)
```
/admin                        Dashboard: 16 métricas + gráficos + atajos + alertas
/admin/pedidos                Tabla compacta + filtros + bulk actions
/admin/pedidos/[id]           Detalle, timeline, cambios de estado, etiqueta
/admin/picking                Modo depósito (lista optimizada para preparar)
/admin/productos              CRUD + imágenes drag&drop + SEO
/admin/productos/packs        Composición de packs
/admin/stock                  Stock por SKU, ajustes, movimientos, alertas
/admin/suscripciones          Suscriptores + filtros por estado/plan
/admin/suscripciones/[id]     Timeline del suscriptor
/admin/suscripciones/planes   CRUD de planes
/admin/suscripciones/box      Box del mes: armado + cálculo de stock necesario
/admin/clientes               Base de clientes + notas internas
/admin/cupones                Promociones
/admin/contenido              CMS por bloques + banners + FAQ + footer
/admin/envios                 Zonas, tarifas, transportistas, etiquetas pendientes
/admin/reportes               10 reportes + export CSV/XLSX
/admin/pagos                  Pagos, fallidos, webhooks (con reproceso)
/admin/auditoria              Log de acciones
/admin/usuarios               Staff, roles y permisos
/admin/configuracion          Empresa, pagos, envíos, email, SEO, age gate
```

### API
```
POST /api/webhooks/mercadopago     firma + idempotencia + encolado
POST /api/webhooks/shipping/[prov] actualización de tracking
GET  /api/labels/[shipmentId]      etiqueta (A4 | térmica), soporta lote
GET  /api/admin/export/[report]    CSV / XLSX
POST /api/cron/[task]              renovaciones, reintentos, sincronización
GET  /sitemap.xml  /robots.txt
```

---

## 6. Flujo e-commerce

```
Navegación → Detalle → Carrito (persistente)
     │
     ├─ validación de stock disponible (y de componentes si es pack)
     ├─ cupón (validación server-side: vigencia, mínimo, usos, alcance)
     ├─ beneficio de socio del Club aplicado automáticamente
     └─ cotización de envío por zona/CP (adapter)
Checkout (contacto → envío → pago)
     │
     ├─ Order en PAYMENT_PENDING + snapshot de precios y dirección
     ├─ Payment PENDING con idempotencyKey
     └─ redirect a Mercado Pago Checkout Pro
Webhook de Mercado Pago  ← ÚNICA fuente de verdad del pago
     │
     └─ transacción:  Payment=APPROVED
                      Order=PAID → STOCK_RESERVED
                      InventoryMovement(RESERVA) por ítem
                      OrderEvent + notificación al cliente
Admin: PREPARING → READY → etiqueta → SHIPPED → DELIVERED
     └─ al despachar: InventoryMovement(VENTA) descuenta onHand y libera reserved
```

El redirect del navegador **solo muestra** el estado leído de la base. Nunca marca pagado.

## 7. Flujo de suscripción

```
ALTA
 /club → elige plan → datos → adapter.createSubscription()  (MP Preapproval)
 Subscription PENDING + externalId

PRIMER COBRO (webhook)
 transacción: SubscriptionCycle(mes actual, PAID)
              Subscription ACTIVE, nextChargeAt = +1 período
              Order(type=SUBSCRIPTION) con snapshot del box y del plan
              reserva de stock de los ítems del box
              Order → PREPARING ("A preparar")
              notificación + etiqueta disponible

RENOVACIÓN MENSUAL (webhook, mes N+1)
 NUEVO SubscriptionCycle + NUEVO Order + nuevos movimientos de stock
 NUNCA una nueva Subscription

PAGO RECHAZADO
 SubscriptionCycle = PAYMENT_FAILED · Subscription = PAYMENT_FAILED
 NO se genera Order · alerta en admin · notificación al cliente
 reintentos del proveedor sincronizados por webhook
 al aprobarse → se genera el Order de ese ciclo

AUTOGESTIÓN
 pausar · reactivar · cancelar · cambiar plan · omitir mes
 reglas configurables (ej.: "omitir hasta 5 días antes del cierre")

CANCELACIÓN
 Subscription CANCELLED · historial intacto · sin ciclos futuros
```

**Snapshot:** cada `Order` de suscripción guarda en JSONB productos, precios, plan,
beneficios, costos y dirección. Si mañana se edita el plan o el box, el pedido
histórico no cambia.

## 8. Flujo de inventario

```
available = onHand - reserved

Venta tienda:      pago aprobado → reserved += q            (RESERVA)
Despacho:          onHand -= q ; reserved -= q              (VENTA)
Cancelación:       reserved -= q                            (LIBERACION)
Devolución:        onHand += q                              (DEVOLUCION)
Ajuste manual:     onHand = nuevo (con motivo obligatorio)  (AJUSTE)
Rotura / merma:    onHand -= q                              (ROTURA / MERMA)
Box del Club:      reserva anticipada por suscriptores       (SUSCRIPCION)
```

Nunca se escribe un número de stock sin `InventoryMovement` (mismo `$transaction`).

Reserva anticipada del Club: `necesario = Σ(items del box × suscriptores activos)`.
El admin ve `stock actual / necesario Club / disponible para tienda / faltante`, y la
tienda no puede vender botellas comprometidas con los socios.

## 9. Flujo de shipping

```
interface ShippingProvider {
  quote(destination, items): Promise<Quote[]>
  createShipment(order): Promise<{ trackingNumber, trackingUrl, labelPayload }>
  getTracking(trackingNumber): Promise<TrackingStatus>
  getLabel(shipmentId, format): Promise<LabelDocument>
  cancelShipment(shipmentId): Promise<void>
}
```

Implementaciones: `MockShippingProvider` (funcional hoy: tracking simulado, etiquetas
reales), `AndreaniProvider`, `CorreoArgentinoProvider`, `OcaProvider` (stubs con
contrato definido, sin APIs inventadas — se completan con documentación oficial).

Etiquetas: render HTML→print en A4 (varias por hoja) y térmica 100×150 mm, con QR
(`qrcode`) y código de barras (`bwip-js`), impresión por lote desde bulk actions.

## 10. Integraciones

| Integración | Estado inicial | Contrato |
|---|---|---|
| Mercado Pago | implementado (Checkout Pro + Preapproval + webhooks) | `PaymentProvider` |
| Logística | Mock funcional; Andreani/OCA/Correo preparados | `ShippingProvider` |
| Email | SMTP/Resend + `ConsoleEmailProvider` en dev | `NotificationChannel` |
| WhatsApp | preparado (interface + stub) | `NotificationChannel` |
| Storage | local en dev, S3-compatible en prod | `StorageProvider` |
| Analytics | configurable por settings (GA4/Meta) | — |
| Email marketing | newsletter con consentimiento, export preparado | — |

## 11. Seguridad

Passwords con bcrypt · cookies `httpOnly`+`secure`+`sameSite=lax` · CSRF por origin
check en server actions · rate limiting en login/checkout/webhooks · validación Zod
server-side en **toda** entrada · permisos verificados en cada acción admin (no solo
en la UI) · verificación de firma y `x-request-id` en webhooks · idempotencia por
`eventId` y `idempotencyKey` · sin datos de tarjeta en nuestra base · secrets solo
server-side · logs sin PII sensible.

## 12. Fases de desarrollo

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Repo, stack, plan, design system, modelo de datos, seed | ✅ |
| 1 | Foundation: DB, auth, settings, storage, age gate, layout | ✅ |
| 2 | Frontend público: home cinematográfica, storytelling, historia, blog | ✅ |
| 3 | E-commerce: catálogo, filtros, detalle, packs, carrito, checkout | ✅ |
| 4 | Pagos: Mercado Pago + webhooks idempotentes + estados | ✅ |
| 5 | Club: landing, planes, alta, ciclos, renovaciones, autogestión | ✅ |
| 6 | Admin: dashboard, pedidos, picking, productos, stock, clientes | ✅ |
| 7 | Operación: etiquetas, envíos, box del mes, reservas, alertas | ✅ |
| 8 | Cupones, beneficios, CMS, banners, newsletter, notificaciones | ✅ |
| 9 | Reportes, exports, auditoría, roles y permisos | ✅ |
| 10 | Tests de lógica crítica, SEO, performance, responsive, a11y | ✅ |

Pendiente de credenciales del cliente (contrato definido, adapter listo):
integración real con Andreani/OCA/Correo Argentino, WhatsApp y storage S3.

## 13. Casos de aceptación (spec §82)

- **A** Compra de 3 vinos → pago MP → webhook → PAID + reserva → prepara → etiqueta → envía → tracking.
- **B** Alta Club Reserva → primer pago → Subscription + Cycle + Order + reserva → box → etiqueta → envío.
- **C** Renovación mensual → webhook → nuevo Cycle + nuevo Order + movimientos. **Sin** nueva Subscription.
- **D** Pago mensual rechazado → alerta, sin despacho; al recuperarse → se genera el Order.
- **E** Baja → historial completo intacto, sin ciclos futuros.
- **F** Cambio del box del mes siguiente → pedidos históricos inalterados (snapshot).
