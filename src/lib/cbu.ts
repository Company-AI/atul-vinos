/**
 * Validación de CBU y CUIT.
 *
 * Un CBU con un dígito cambiado suele seguir siendo un CBU válido de OTRA
 * cuenta: el error no rebota, la plata llega a un desconocido y no vuelve.
 * Por eso se verifica antes de publicarlo en el checkout y no después.
 */

/** Dígito verificador de un bloque, con los pesos que fija el BCRA. */
function verificador(digitos: string, pesos: number[]): number {
  const suma = [...digitos].reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  return (10 - (suma % 10)) % 10;
}

/**
 * Un CBU son 22 dígitos en dos bloques, cada uno con su verificador:
 * 3 de banco + 4 de sucursal + 1 verificador, y 13 de cuenta + 1 verificador.
 */
export function cbuValido(valor: string): boolean {
  const cbu = valor.replace(/\D/g, "");
  if (cbu.length !== 22) return false;

  /*
    El código de banco no puede ser 000: no existe esa entidad. Va aparte
    porque los dígitos verificadores NO lo atajan —un CBU de 22 ceros los
    cumple perfectamente— y es justo la forma que suele tener un valor de
    relleno que se coló hasta producción.
  */
  if (cbu.slice(0, 3) === "000") return false;

  const bloque1 = cbu.slice(0, 8);
  const bloque2 = cbu.slice(8);

  return (
    verificador(bloque1.slice(0, 7), [7, 1, 3, 9, 7, 1, 3]) === Number(bloque1[7]) &&
    verificador(bloque2.slice(0, 13), [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]) ===
      Number(bloque2[13])
  );
}

/** CUIT: 11 dígitos, verificador por módulo 11. */
export function cuitValido(valor: string): boolean {
  const cuit = valor.replace(/\D/g, "");
  if (cuit.length !== 11) return false;

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = [...cuit.slice(0, 10)].reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? 0 : resto === 10 ? 9 : resto;

  return esperado === Number(cuit[10]);
}

/** 23-31104483-4 */
export function formatearCuit(valor: string): string {
  const cuit = valor.replace(/\D/g, "");
  if (cuit.length !== 11) return valor.trim();
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit[10]}`;
}
