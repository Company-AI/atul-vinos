import { describe, expect, it } from "vitest";
import { cbuValido, cuitValido, formatearCuit } from "@/lib/cbu";

/*
  Un CBU con un dígito cambiado suele seguir siendo un CBU válido de otra
  cuenta: el error no rebota y la plata no vuelve. Estos casos son los que
  evitan publicar un número mal tipeado en el checkout.
*/

const CBU_REAL = "0290107310000596083475";

describe("CBU", () => {
  it("acepta uno válido", () => {
    expect(cbuValido(CBU_REAL)).toBe(true);
  });

  it("ignora espacios y guiones", () => {
    expect(cbuValido("0290 1073 1000 0596 0834 75")).toBe(true);
  });

  it("rechaza si no son 22 dígitos", () => {
    expect(cbuValido("029010731000059608347")).toBe(false);
    expect(cbuValido(CBU_REAL + "0")).toBe(false);
    expect(cbuValido("")).toBe(false);
  });

  it("rechaza un dígito cambiado en el primer bloque", () => {
    const roto = "0" + "3" + CBU_REAL.slice(2);
    expect(cbuValido(roto)).toBe(false);
  });

  it("rechaza un dígito cambiado en el segundo bloque", () => {
    expect(cbuValido("0290107320000596083475")).toBe(false);
  });

  /*
    Los 22 ceros CUMPLEN los dos dígitos verificadores: por eso hace falta
    rechazar el código de banco 000 por separado. Es exactamente la forma de
    un valor de relleno que se escapó a producción.
  */
  it("rechaza el CBU de relleno en ceros, que sí pasa los verificadores", () => {
    expect(cbuValido("0000000000000000000000")).toBe(false);
  });
});

describe("CUIT", () => {
  it("acepta uno válido, con o sin guiones", () => {
    expect(cuitValido("23311044834")).toBe(true);
    expect(cuitValido("23-31104483-4")).toBe(true);
  });

  it("rechaza un verificador que no cierra", () => {
    expect(cuitValido("23311044835")).toBe(false);
  });

  it("rechaza largos que no son 11", () => {
    expect(cuitValido("2331104483")).toBe(false);
    expect(cuitValido("")).toBe(false);
  });

  it("formatea", () => {
    expect(formatearCuit("23311044834")).toBe("23-31104483-4");
  });
});
