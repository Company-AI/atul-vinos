import { describe, expect, it } from "vitest";
import { mapearCotizaciones, partirServiceCode } from "@/infra/shipping/enviopack";
import { provinceCode } from "@/lib/ar";

/*
  Igual que con Andreani: la llamada necesita una cuenta, así que se prueba lo
  nuestro. Acá eso es cómo se identifica la provincia —mandar la letra
  equivocada devuelve el precio de otra punta del país con cara de correcto— y
  cómo se leen las opciones que vuelven.
*/

describe("provincia en formato ISO", () => {
  it("traduce el nombre que elige la persona", () => {
    expect(provinceCode("Córdoba")).toBe("X");
    expect(provinceCode("Buenos Aires")).toBe("B");
    expect(provinceCode("CABA")).toBe("C");
    expect(provinceCode("Tierra del Fuego")).toBe("V");
  });

  it("la saca del CPA cuando no hay nombre", () => {
    expect(provinceCode("", "X5800ABC")).toBe("X");
    expect(provinceCode("", "c1425cba")).toBe("C");
  });

  it("no adivina con un CP de cuatro dígitos ni con una letra inventada", () => {
    expect(provinceCode("", "5800")).toBeNull();
    expect(provinceCode("", "Ñ5800ABC")).toBeNull();
    expect(provinceCode("Narnia")).toBeNull();
  });
});

describe("cotizaciones de Envíopack", () => {
  const respuesta = [
    { correo: { id: "and", nombre: "Andreani" }, servicio: "N", modalidad: "D", valor: 8900.4, horas_entrega: 72 },
    { correo: { id: "oca", nombre: "OCA" }, servicio: "N", modalidad: "D", valor: 9400, horas_entrega: 48 },
    { correo: { id: "and", nombre: "Andreani" }, servicio: "P", modalidad: "D", valor: 12000, horas_entrega: 24 },
  ];

  it("deja una opción por correo, la más barata, ordenadas por precio", () => {
    const quotes = mapearCotizaciones(respuesta);
    expect(quotes.map((q) => [q.serviceName, q.price])).toEqual([
      ["Andreani", 8900],
      ["OCA", 9400],
    ]);
  });

  it("pasa las horas a días redondeando para arriba", () => {
    const [andreani, oca] = mapearCotizaciones(respuesta);
    expect(andreani.etaMaxDays).toBe(3);
    expect(oca.etaMaxDays).toBe(2);
  });

  it("aclara cuando la entrega es a sucursal", () => {
    const [q] = mapearCotizaciones([
      { correo: { nombre: "OCA" }, modalidad: "S", valor: 5000, horas_entrega: 48 },
    ]);
    expect(q.serviceName).toBe("OCA a sucursal");
  });

  it("descarta filas sin precio en vez de cotizar cero", () => {
    expect(mapearCotizaciones([{ correo: { nombre: "X" }, valor: "ni idea" }])).toEqual([]);
    expect(mapearCotizaciones([])).toEqual([]);
    expect(mapearCotizaciones({ error: "algo" })).toEqual([]);
  });

  it("no inventa plazo cuando no viene", () => {
    const [q] = mapearCotizaciones([{ correo: { nombre: "OCA" }, valor: 5000 }]);
    expect(q.etaMinDays).toBeNull();
  });
});

describe("código de servicio al despachar", () => {
  it("recupera el correo con el que se cotizó, para despachar con ese y no con otro", () => {
    expect(partirServiceCode("andreani-N-D")).toEqual({
      correo: "andreani",
      servicio: "N",
      modalidad: "D",
    });
  });

  it("reconoce la entrega a sucursal", () => {
    expect(partirServiceCode("oca-X-S").modalidad).toBe("S");
  });

  it("devuelve correo nulo cuando el pedido no guardó con cuál se cotizó", () => {
    // Es lo que hace fallar el despacho con un mensaje claro en vez de elegir
    // un correo al azar y cobrarle al cliente otra tarifa.
    expect(partirServiceCode("correo-N-D").correo).toBeNull();
    expect(partirServiceCode("Envío estándar").correo).toBe("Envío estándar");
  });

  it("asume servicio estándar a domicilio si falta el detalle", () => {
    expect(partirServiceCode("andreani")).toEqual({
      correo: "andreani",
      servicio: "N",
      modalidad: "D",
    });
  });
});
