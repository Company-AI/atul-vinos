import { prisma } from "@/infra/db/prisma";

/**
 * Si la persona nunca completó una compra.
 *
 * Mira la cuenta Y el mail, no sólo la cuenta. Antes contaba únicamente por
 * `userId`, así que a quien compraba como invitado le daba siempre "primera
 * compra": alcanzaba con no iniciar sesión para volver a usar un cupón de
 * bienvenida con el mismo mail de siempre.
 *
 * Un pedido cuenta apenas deja de estar esperando pago. No espera a que esté
 * entregado: el cupón ya se consumió en ese pedido.
 */
export async function esPrimeraCompra(quien: {
  userId?: string | null;
  email?: string | null;
}): Promise<boolean> {
  const email = quien.email?.toLowerCase().trim() || null;
  if (!quien.userId && !email) return true;

  const previos = await prisma.order.count({
    where: {
      status: { notIn: ["PAYMENT_PENDING", "CANCELLED"] },
      OR: [
        ...(quien.userId ? [{ userId: quien.userId }] : []),
        ...(email ? [{ customerEmail: { equals: email, mode: "insensitive" as const } }] : []),
      ],
    },
  });

  return previos === 0;
}
