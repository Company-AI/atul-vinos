import { describe, expect, it } from "vitest";
import { mapearTarifa, volumenCm3 } from "@/infra/shipping/andreani";

/*
  No se puede probar la llamada —hace falta una cuenta de Andreani—, así que se
  prueba lo que sí es nuestro: cómo se arma el volumen que se manda y cómo se
  lee el precio que vuelve. Son las dos puntas donde un error se cobra plata de
  más o de menos.
*/

describe("cotizador de Andreani", () => {
  it("cobra el total con IVA, que es lo que paga la persona", () => {
    const quotes = mapearTarifa({
      pesoAforado: "70.00",
      tarifaSinIva: { total: "5819.18" },
      tarifaConIva: { total: "7041.21" },
    });
    expect(quotes).toHaveLength(1);
    expect(quotes[0].price).toBe(7041);
    expect(quotes[0].providerCode).toBe("andreani");
  });

  it("no inventa un plazo de entrega, porque el cotizador no lo devuelve", () => {
    const [quote] = mapearTarifa({ tarifaConIva: { total: "7041.21" } });
    expect(quote.etaMinDays).toBeNull();
    expect(quote.etaMaxDays).toBeNull();
  });

  it("si sólo viene la tarifa sin IVA, usa esa antes que no cotizar", () => {
    const [quote] = mapearTarifa({ tarifaSinIva: { total: "5819.18" } });
    expect(quote.price).toBe(5819);
  });

  it("devuelve lista vacía ante una respuesta que no trae precio", () => {
    expect(mapearTarifa({})).toEqual([]);
    expect(mapearTarifa({ tarifaConIva: { total: "ni idea" } })).toEqual([]);
  });

  it("el volumen crece con las botellas y nunca es cero", () => {
    expect(volumenCm3(6)).toBeGreaterThan(volumenCm3(2));
    expect(volumenCm3(0)).toBeGreaterThan(0);
    // Una botella: unos 2300 cm³ con el embalaje incluido.
    expect(volumenCm3(1)).toBe(2300);
  });
});
