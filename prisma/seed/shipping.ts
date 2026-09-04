/**
 * Zonas y tarifas de envío.
 *
 * Viven acá porque las consume el seed y también la capa demo
 * (src/infra/demo), que sirve /envios cuando no hay base.
 */

export type ZoneSeed = {
  name: string;
  sortOrder: number;
  provinces: string[];
  cities: string[];
  rates: {
    name: string;
    price: number;
    freeFrom?: number;
    etaMinDays: number;
    etaMaxDays: number;
  }[];
};

export const SHIPPING_ZONES: ZoneSeed[] = [
    {
      name: "Río Cuarto y alrededores", sortOrder: 10,
      provinces: ["Córdoba"], cities: ["Río Cuarto", "Las Higueras", "Holmberg"],
      rates: [
        { name: "Envío a domicilio", price: 3500, freeFrom: 60000, etaMinDays: 1, etaMaxDays: 2 },
        { name: "Retiro en depósito", price: 0, etaMinDays: 0, etaMaxDays: 1 },
      ],
    },
    {
      name: "Provincia de Córdoba", sortOrder: 20,
      provinces: ["Córdoba"], cities: [],
      rates: [{ name: "Envío estándar", price: 6900, freeFrom: 100000, etaMinDays: 2, etaMaxDays: 4 }],
    },
    {
      name: "Centro (Buenos Aires, Santa Fe, Mendoza)", sortOrder: 30,
      provinces: ["Buenos Aires", "CABA", "Santa Fe", "Mendoza", "San Luis", "Entre Ríos"], cities: [],
      rates: [
        { name: "Envío estándar", price: 8900, freeFrom: 100000, etaMinDays: 3, etaMaxDays: 5 },
        { name: "Envío express", price: 15900, etaMinDays: 1, etaMaxDays: 2 },
      ],
    },
    {
      name: "Resto del país", sortOrder: 40, provinces: [], cities: [],
      rates: [{ name: "Envío estándar", price: 12900, freeFrom: 150000, etaMinDays: 4, etaMaxDays: 8 }],
    },
  ];
