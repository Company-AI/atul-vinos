import { getSettings } from "@/domain/settings/service";
import { formatARS, fromCents, toCents, type MoneyInput } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * Las dos líneas que van debajo del precio: en cuotas y por transferencia.
 *
 * Es lo primero que mira alguien que compara, y hasta ahora estaba sólo
 * escrito en la franja de arriba, igual para todos los vinos. Puesto sobre
 * cada precio, el número ya está hecho y no hay que calcularlo de cabeza.
 *
 * Los dos valores salen de Configuración y no de acá: son promesas
 * comerciales que cambian —una promoción que arranca, un recargo que vuelve—
 * y tienen que poder moverse sin tocar código. En cero, la línea no aparece.
 *
 * Lee los ajustes por su cuenta en vez de recibirlos: se resuelven una sola
 * vez por visita aunque la grilla tenga veinte vinos.
 */
export async function FormasDePago({
  value,
  size = "md",
  className,
}: {
  value: MoneyInput;
  size?: "sm" | "md";
  className?: string;
}) {
  const { payments } = await getSettings();

  const cuotas = payments.installmentsEnabled ? payments.interestFreeInstallments : 0;
  const descuento = payments.transferDiscountPercent;
  if (cuotas < 2 && descuento <= 0) return null;

  /*
    En centavos y recién al final a pesos: dividir el precio en tres y volver
    a multiplicar con decimales sueltos termina mostrando un total que no
    coincide con el precio de arriba.
  */
  const centavos = toCents(value);
  const porCuota = cuotas >= 2 ? fromCents(Math.round(centavos / cuotas)) : null;
  const conTransferencia =
    descuento > 0 ? fromCents(Math.round(centavos * (1 - descuento / 100))) : null;

  const chico = size === "sm";

  return (
    <div className={cn("flex flex-col", chico ? "gap-0 text-[12px]" : "gap-0.5 text-[13px]", className)}>
      {porCuota !== null && (
        <p className="tabular text-stone-400">
          {cuotas} x {formatARS(porCuota)} sin interés
        </p>
      )}
      {conTransferencia !== null && (
        /*
          Granate: en este sitio ese color está reservado a ofertas y
          descuentos, así que el precio con transferencia se lee como lo que
          es sin necesidad de explicarlo.
        */
        <p className="tabular font-bold text-wine-700">
          {formatARS(conTransferencia)} con transferencia
        </p>
      )}
    </div>
  );
}
