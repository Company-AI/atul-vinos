"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getCart, getCartToken } from "@/domain/cart/service";
import { createOrderFromCart } from "@/domain/orders/create";
import { startOrderCheckout } from "@/domain/payments/service";
import { estimateBottles, quoteShipping } from "@/domain/shipping/service";
import { getSession } from "@/infra/auth/session";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";
import { AR_PROVINCES, isValidPostalCode } from "@/lib/ar";
import type { ShippingQuote } from "@/domain/shipping/ports";

const addressSchema = z.object({
  street: z.string().min(2, "Ingresá la calle."),
  number: z.string().min(1, "Ingresá la altura."),
  apartment: z.string().optional(),
  city: z.string().min(2, "Ingresá la localidad."),
  province: z.enum(AR_PROVINCES, { message: "Elegí una provincia." }),
  postalCode: z.string().refine(isValidPostalCode, "Código postal inválido."),
  reference: z.string().optional(),
});

const contactSchema = z.object({
  firstName: z.string().min(2, "Ingresá tu nombre."),
  lastName: z.string().min(2, "Ingresá tu apellido."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(6, "Ingresá un teléfono de contacto."),
  documentId: z.string().optional(),
});

/** Cotiza el envío para la dirección ingresada en el checkout. */
export async function quoteShippingForCheckout(input: {
  province: string;
  city: string;
  postalCode: string;
}): Promise<{ ok: true; quotes: ShippingQuote[] } | { ok: false; error: string }> {
  const parsed = z
    .object({
      province: z.string().min(2),
      city: z.string().min(2),
      postalCode: z.string().refine(isValidPostalCode),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Completá localidad, provincia y código postal." };
  }

  const [cart, session] = await Promise.all([getCart(), getSession()]);
  if (cart.lines.length === 0) return { ok: false, error: "Tu carrito está vacío." };

  const member = await getMemberBenefits(session?.userId);

  const quotes = await quoteShipping({
    destination: {
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
      province: parsed.data.province,
    },
    bottles: estimateBottles(cart.lines),
    netAmount: cart.pricing.subtotal - cart.pricing.discountTotal,
    shippingCovered: member.freeShipping,
  });

  if (quotes.length === 0) {
    return {
      ok: false,
      error: "Todavía no tenemos una tarifa para esa zona. Escribinos y lo resolvemos.",
    };
  }

  return { ok: true, quotes };
}

const submitSchema = z.object({
  contact: contactSchema,
  address: addressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billing: addressSchema.merge(contactSchema).extend({ taxId: z.string().optional() }).optional(),
  shipping: z.object({
    serviceCode: z.string().min(1, "Elegí un método de envío."),
    methodName: z.string().min(1),
    price: z.number().min(0),
    carrierCode: z.string().min(1),
  }),
  customerNote: z.string().max(500).optional(),
});

export type SubmitCheckoutResult =
  | { ok: true; redirectUrl: string; orderNumber: number }
  | { ok: false; error: string; field?: string };

/**
 * Crea el pedido y devuelve la URL de pago del proveedor.
 * El pedido queda PAYMENT_PENDING: solo el webhook lo marca pagado.
 */
export async function submitCheckout(
  input: z.input<typeof submitSchema>,
): Promise<SubmitCheckoutResult> {
  const requestHeaders = await headers();
  const limit = rateLimit(`checkout:${clientIp(requestHeaders)}`, {
    limit: 10,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return { ok: false, error: "Demasiados intentos. Esperá un momento y volvé a probar." };
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Revisá los datos del formulario.",
      field: issue?.path.join("."),
    };
  }

  const cartToken = await getCartToken();
  if (!cartToken) return { ok: false, error: "Tu carrito está vacío." };

  const session = await getSession();
  const data = parsed.data;

  const created = await createOrderFromCart({
    cartToken,
    userId: session?.userId ?? null,
    contact: data.contact,
    address: data.address,
    billing: data.billingSameAsShipping ? null : (data.billing ?? null),
    shipping: {
      methodName: data.shipping.methodName,
      price: data.shipping.price,
      carrierCode: data.shipping.carrierCode,
      serviceCode: data.shipping.serviceCode,
    },
    customerNote: data.customerNote ?? null,
  });

  if (!created.ok) return { ok: false, error: created.error };

  const checkout = await startOrderCheckout(created.data.orderId);
  if (!checkout.ok) {
    return {
      ok: false,
      error: `Creamos tu pedido #${created.data.orderNumber} pero no pudimos iniciar el pago: ${checkout.error}`,
    };
  }

  return {
    ok: true,
    redirectUrl: checkout.data.redirectUrl,
    orderNumber: created.data.orderNumber,
  };
}
