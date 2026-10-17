import { describe, expect, it } from "vitest";
import { parsearApertura, tiendaCerrada } from "@/domain/apertura";

/*
  Abrir la tienda es irreversible en los hechos: una vez que entró gente, no
  se puede deshacer. Así que cada estado tiene su caso, incluido el de la
  variable mal escrita.
*/

const APERTURA = "2026-10-24T20:00:00-03:00";
const UN_MINUTO_ANTES = new Date("2026-10-24T19:59:00-03:00");
const UN_MINUTO_DESPUES = new Date("2026-10-24T20:01:00-03:00");

describe("la puerta de la tienda", () => {
  describe('en "1" — se abre a mano', () => {
    it("queda cerrada aunque la fecha ya haya pasado", () => {
      expect(tiendaCerrada("1", APERTURA, UN_MINUTO_DESPUES)).toBe(true);
    });

    it("queda cerrada sin fecha", () => {
      expect(tiendaCerrada("1", undefined, UN_MINUTO_DESPUES)).toBe(true);
    });
  });

  describe('en "auto" — abre sola con la cuenta regresiva', () => {
    it("cerrada un minuto antes", () => {
      expect(tiendaCerrada("auto", APERTURA, UN_MINUTO_ANTES)).toBe(true);
    });

    it("abierta un minuto después", () => {
      expect(tiendaCerrada("auto", APERTURA, UN_MINUTO_DESPUES)).toBe(false);
    });

    it("abre en el instante exacto", () => {
      expect(tiendaCerrada("auto", APERTURA, new Date(APERTURA))).toBe(false);
    });

    it("respeta la zona horaria: las 20:00 de Argentina son las 23:00 UTC", () => {
      expect(tiendaCerrada("auto", APERTURA, new Date("2026-10-24T22:59:00Z"))).toBe(true);
      expect(tiendaCerrada("auto", APERTURA, new Date("2026-10-24T23:01:00Z"))).toBe(false);
    });

    it("sin fecha queda cerrada: una variable vacía no abre la tienda", () => {
      expect(tiendaCerrada("auto", undefined, UN_MINUTO_DESPUES)).toBe(true);
      expect(tiendaCerrada("auto", "   ", UN_MINUTO_DESPUES)).toBe(true);
    });

    it("con fecha ilegible queda cerrada", () => {
      expect(tiendaCerrada("auto", "24 de octubre", UN_MINUTO_DESPUES)).toBe(true);
      expect(tiendaCerrada("auto", "no-es-una-fecha", UN_MINUTO_DESPUES)).toBe(true);
    });
  });

  describe("cualquier otro valor — abierta", () => {
    it("en cero", () => {
      expect(tiendaCerrada("0", APERTURA, UN_MINUTO_ANTES)).toBe(false);
    });

    it("sin la variable, como en desarrollo", () => {
      expect(tiendaCerrada(undefined, undefined, UN_MINUTO_ANTES)).toBe(false);
    });
  });
});

describe("parsearApertura", () => {
  it("acepta una fecha con zona horaria", () => {
    expect(parsearApertura(APERTURA)?.toISOString()).toBe("2026-10-24T23:00:00.000Z");
  });

  it("devuelve null con lo que no se entiende", () => {
    for (const malo of [undefined, "", "   ", "mañana", "32/13/2026"]) {
      expect(parsearApertura(malo)).toBeNull();
    }
  });
});
