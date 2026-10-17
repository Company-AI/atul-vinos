import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";

/**
 * Si el cupón que promete la ventana de bienvenida se puede usar HOY.
 *
 * Existe porque la ventana prometía por su cuenta: alcanzaba con que
 * estuviera encendida para entregar el código, sin mirar nunca el cupón. Si
 * alguien lo desactivaba desde Cupones —para que arranque recién cuando abra
 * la tienda, por ejemplo— la ventana lo seguía regalando igual y el checkout
 * después lo rechazaba. La persona se quedaba con un código que no servía.
 *
 * Mirar las fechas acá es lo que convierte el "Desde / Hasta" del cupón en
 * una agenda: se carga la fecha de apertura en "Desde" y la ventana empieza
 * a ofrecerlo sola ese día, sin que nadie toque nada.
 *
 * No chequea el uso por persona ni la primera compra: eso depende de quién
 * esté comprando y lo resuelve `validateCoupon` en el checkout. Acá sólo se
 * pregunta si el cupón está vivo.
 */
export async function cuponDeBienvenidaVigente(): Promise<string | null> {
  const { promo } = await getSettings();
  if (!promo.enabled) return null;

  const code = promo.couponCode.trim().toUpperCase();
  if (!code) return null;

  const cupon = await prisma.coupon.findUnique({
    where: { code },
    select: { code: true, isActive: true, startsAt: true, endsAt: true, maxUses: true, usedCount: true },
  });

  if (!cupon || !cupon.isActive) return null;

  const ahora = new Date();
  if (cupon.startsAt && cupon.startsAt > ahora) return null;
  if (cupon.endsAt && cupon.endsAt < ahora) return null;
  if (cupon.maxUses !== null && cupon.usedCount >= cupon.maxUses) return null;

  return cupon.code;
}
