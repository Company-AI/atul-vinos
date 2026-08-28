import type { ShippingProvider } from "@/domain/shipping/ports";
import { MockShippingProvider } from "./mock";
import { AndreaniProvider, CorreoArgentinoProvider, OcaProvider } from "./external-providers";

const providers = new Map<string, ShippingProvider>();

function register(provider: ShippingProvider) {
  providers.set(provider.code, provider);
}

register(new MockShippingProvider());
register(new AndreaniProvider());
register(new OcaProvider());
register(new CorreoArgentinoProvider());

export const FALLBACK_PROVIDER_CODE = "mock";

/**
 * Devuelve el proveedor pedido. Si no está configurado (sin credenciales),
 * cae al proveedor interno para que la operación nunca se detenga.
 */
export function getShippingProvider(code?: string | null): ShippingProvider {
  const requested = code ? providers.get(code) : undefined;
  if (requested?.isConfigured()) return requested;
  return providers.get(FALLBACK_PROVIDER_CODE)!;
}

export function listShippingProviders(): ShippingProvider[] {
  return [...providers.values()];
}
