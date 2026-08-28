/**
 * Catálogo de permisos. Los roles son configurables desde /admin/usuarios:
 * esto define el universo disponible y los presets iniciales del seed.
 */

export const PERMISSIONS = [
  // Pedidos
  { code: "orders.view", label: "Ver pedidos", group: "Pedidos" },
  { code: "orders.edit", label: "Editar pedidos", group: "Pedidos" },
  { code: "orders.prepare", label: "Preparar y despachar", group: "Pedidos" },
  { code: "orders.cancel", label: "Cancelar / reembolsar", group: "Pedidos" },
  { code: "orders.labels", label: "Generar e imprimir etiquetas", group: "Pedidos" },
  // Productos
  { code: "products.view", label: "Ver productos", group: "Productos" },
  { code: "products.edit", label: "Crear y editar productos", group: "Productos" },
  { code: "products.price", label: "Modificar precios", group: "Productos" },
  { code: "products.delete", label: "Archivar productos", group: "Productos" },
  // Stock
  { code: "stock.view", label: "Ver stock", group: "Stock" },
  { code: "stock.edit", label: "Registrar movimientos y ajustes", group: "Stock" },
  // Suscripciones
  { code: "subscriptions.view", label: "Ver suscripciones", group: "Club" },
  { code: "subscriptions.edit", label: "Administrar suscripciones", group: "Club" },
  { code: "subscriptions.plans", label: "Administrar planes", group: "Club" },
  { code: "subscriptions.box", label: "Armar el box del mes", group: "Club" },
  // Clientes
  { code: "customers.view", label: "Ver clientes", group: "Clientes" },
  { code: "customers.edit", label: "Editar clientes y notas", group: "Clientes" },
  // Marketing
  { code: "coupons.view", label: "Ver cupones", group: "Marketing" },
  { code: "coupons.edit", label: "Administrar cupones", group: "Marketing" },
  { code: "cms.edit", label: "Editar contenido y banners", group: "Marketing" },
  // Pagos
  { code: "payments.view", label: "Ver pagos", group: "Pagos" },
  { code: "payments.manage", label: "Reprocesar webhooks y reembolsos", group: "Pagos" },
  // Reportes
  { code: "reports.view", label: "Ver reportes", group: "Reportes" },
  { code: "reports.export", label: "Exportar datos", group: "Reportes" },
  // Sistema
  { code: "settings.view", label: "Ver configuración", group: "Sistema" },
  { code: "settings.edit", label: "Editar configuración", group: "Sistema" },
  { code: "users.manage", label: "Administrar usuarios y roles", group: "Sistema" },
  { code: "audit.view", label: "Ver auditoría", group: "Sistema" },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]["code"];

export const ROLE_PRESETS: Record<
  string,
  { name: string; description: string; permissions: PermissionCode[] | "*" }
> = {
  super_admin: {
    name: "Super Admin",
    description: "Acceso total, incluyendo configuración de pagos y usuarios.",
    permissions: "*",
  },
  admin: {
    name: "Admin",
    description: "Opera todo el negocio sin administrar usuarios ni credenciales.",
    permissions: [
      "orders.view", "orders.edit", "orders.prepare", "orders.cancel", "orders.labels",
      "products.view", "products.edit", "products.price", "products.delete",
      "stock.view", "stock.edit",
      "subscriptions.view", "subscriptions.edit", "subscriptions.plans", "subscriptions.box",
      "customers.view", "customers.edit",
      "coupons.view", "coupons.edit", "cms.edit",
      "payments.view",
      "reports.view", "reports.export",
      "settings.view", "audit.view",
    ],
  },
  deposito: {
    name: "Depósito",
    description: "Prepara pedidos, imprime etiquetas y mueve stock. No ve precios ni pagos.",
    permissions: [
      "orders.view", "orders.prepare", "orders.labels",
      "products.view",
      "stock.view", "stock.edit",
      "subscriptions.box",
    ],
  },
  atencion_cliente: {
    name: "Atención al cliente",
    description: "Consulta pedidos, clientes y suscripciones; no modifica precios ni stock.",
    permissions: [
      "orders.view", "orders.edit",
      "products.view",
      "stock.view",
      "subscriptions.view", "subscriptions.edit",
      "customers.view", "customers.edit",
      "coupons.view",
      "payments.view",
    ],
  },
};
