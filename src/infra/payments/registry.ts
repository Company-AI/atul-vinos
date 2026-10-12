import type { PaymentProvider } from "@/domain/payments/ports";
import { MercadoPagoProvider } from "./mercadopago";
import { MockPaymentProvider } from "./mock";
import { TransferenciaProvider } from "./transferencia";

const mercadopago = new MercadoPagoProvider();
const mock = new MockPaymentProvider();
const transferencia = new TransferenciaProvider();

const providers = new Map<string, PaymentProvider>([
  [mercadopago.code, mercadopago],
  [mock.code, mock],
  [transferencia.code, transferencia],
]);

/**
 * Proveedor activo. Mercado Pago cuando hay credenciales; el simulador cuando
 * no las hay y estamos fuera de producción, para poder probar el flujo completo.
 *
 * La transferencia nunca sale por descarte: se usa sólo cuando el comprador la
 * eligió y su código llega explícito. Caer en ella por accidente dejaría un
 * pedido esperando una plata que nadie pidió.
 */
export function getPaymentProvider(code?: string | null): PaymentProvider {
  if (code) {
    const requested = providers.get(code);
    if (requested) return requested;
  }
  if (mercadopago.isConfigured()) return mercadopago;
  if (mock.isConfigured()) return mock;
  return mercadopago; // en producción sin credenciales: falla explícitamente al usarlo
}

export function activeProviderCode(): string {
  return getPaymentProvider().code;
}

export function listPaymentProviders(): PaymentProvider[] {
  return [...providers.values()];
}
