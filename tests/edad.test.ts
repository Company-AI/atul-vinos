import { describe, expect, it } from "vitest";
import { edadEnAnios, fechaDeNacimiento } from "@/domain/promotions/edad";

const hoy = new Date(Date.UTC(2026, 9, 13)); // 13 de octubre de 2026

describe("edad", () => {
  it("cuenta los años cumplidos", () => {
    expect(edadEnAnios(new Date(Date.UTC(2000, 9, 13)), hoy)).toBe(26);
  });

  it("no cuenta el año si todavía no cumplió", () => {
    // Cumple el 14: ayer todavía tenía 25.
    expect(edadEnAnios(new Date(Date.UTC(2000, 9, 14)), hoy)).toBe(25);
  });

  it("cuenta el año el mismo día del cumpleaños", () => {
    expect(edadEnAnios(new Date(Date.UTC(2008, 9, 13)), hoy)).toBe(18);
  });

  it("acepta una fecha válida", () => {
    expect(fechaDeNacimiento("1990-05-01")?.toISOString()).toBe("1990-05-01T00:00:00.000Z");
  });

  it("no corre la fecha por la zona horaria", () => {
    // En UTC-3 un Date local daría el 30 de abril.
    expect(fechaDeNacimiento("1990-05-01")?.getUTCDate()).toBe(1);
  });

  it("rechaza un día que no existe", () => {
    expect(fechaDeNacimiento("1990-02-31")).toBeNull();
    expect(fechaDeNacimiento("1990-13-01")).toBeNull();
  });

  it("rechaza lo que no tiene forma de fecha", () => {
    for (const malo of ["", "ayer", "01/05/1990", "1990-5-1", "   "]) {
      expect(fechaDeNacimiento(malo)).toBeNull();
    }
  });

  it("rechaza el futuro y lo imposible", () => {
    expect(fechaDeNacimiento("2099-01-01")).toBeNull();
    expect(fechaDeNacimiento("1850-01-01")).toBeNull();
  });
});
