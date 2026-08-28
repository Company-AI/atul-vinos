import { beforeEach, describe, expect, it } from "vitest";
import {
  availableOf, createPack, createWine, prisma, resetDatabase,
} from "./helpers/factories";
import { getAvailabilityMap, expandToStockUnits } from "@/domain/inventory/availability";
import { recordMovement } from "@/domain/inventory/service";

beforeEach(async () => {
  await resetDatabase();
});

describe("disponibilidad de stock", () => {
  it("descuenta lo reservado del stock físico", async () => {
    const wine = await createWine({ onHand: 50, reserved: 12 });
    const map = await getAvailabilityMap([wine.id]);
    expect(map.get(wine.id)?.available).toBe(38);
  });

  it("nunca devuelve disponibilidad negativa", async () => {
    const wine = await createWine({ onHand: 5, reserved: 20 });
    const map = await getAvailabilityMap([wine.id]);
    expect(map.get(wine.id)?.available).toBe(0);
  });

  it("deriva el stock del pack del componente más escaso", async () => {
    const a = await createWine({ onHand: 30 });
    const b = await createWine({ onHand: 9 });
    const c = await createWine({ onHand: 100 });
    const pack = await createPack([
      { productId: a.id, quantity: 1 },
      { productId: b.id, quantity: 1 },
      { productId: c.id, quantity: 1 },
    ]);

    const map = await getAvailabilityMap([pack.id]);
    expect(map.get(pack.id)?.available).toBe(9);
    expect(map.get(pack.id)?.limitedBy?.productId).toBe(b.id);
  });

  it("un pack con un componente sin stock no se puede vender", async () => {
    const a = await createWine({ onHand: 30 });
    const b = await createWine({ onHand: 0 });
    const pack = await createPack([
      { productId: a.id, quantity: 1 },
      { productId: b.id, quantity: 1 },
    ]);

    const map = await getAvailabilityMap([pack.id]);
    expect(map.get(pack.id)?.available).toBe(0);
  });

  it("considera la cantidad de cada componente del pack", async () => {
    const a = await createWine({ onHand: 10 });
    const pack = await createPack([{ productId: a.id, quantity: 3 }]);
    const map = await getAvailabilityMap([pack.id]);
    // 10 botellas / 3 por pack = 3 packs
    expect(map.get(pack.id)?.available).toBe(3);
  });

  it("expande un pack a sus componentes al calcular unidades de stock", async () => {
    const a = await createWine();
    const b = await createWine();
    const pack = await createPack([
      { productId: a.id, quantity: 2 },
      { productId: b.id, quantity: 1 },
    ]);

    const units = await expandToStockUnits([
      { productId: pack.id, quantity: 3 },
      { productId: a.id, quantity: 1 },
    ]);

    const byId = new Map(units.map((u) => [u.productId, u.quantity]));
    expect(byId.get(a.id)).toBe(2 * 3 + 1);
    expect(byId.get(b.id)).toBe(3);
  });
});

describe("movimientos de stock", () => {
  it("registra el valor anterior y posterior en cada movimiento", async () => {
    const wine = await createWine({ onHand: 100, reserved: 0 });

    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, { productId: wine.id, type: "RESERVA", quantity: 5 });
    });

    const movement = await prisma.inventoryMovement.findFirst({
      where: { productId: wine.id },
      orderBy: { createdAt: "desc" },
    });

    expect(movement?.reservedBefore).toBe(0);
    expect(movement?.reservedAfter).toBe(5);
    expect(movement?.onHandBefore).toBe(100);
    expect(movement?.onHandAfter).toBe(100);
    expect(await availableOf(wine.id)).toBe(95);
  });

  it("la venta descuenta físico y libera la reserva", async () => {
    const wine = await createWine({ onHand: 100, reserved: 0 });

    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, { productId: wine.id, type: "RESERVA", quantity: 4 });
      await recordMovement(tx, { productId: wine.id, type: "VENTA", quantity: 4 });
    });

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.onHand).toBe(96);
    expect(inventory?.reserved).toBe(0);
  });

  it("la liberación no deja reservas negativas", async () => {
    const wine = await createWine({ onHand: 20, reserved: 2 });
    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, { productId: wine.id, type: "LIBERACION", quantity: 10 });
    });
    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(inventory?.reserved).toBe(0);
  });

  it("el ajuste fija el stock físico y deja constancia del delta", async () => {
    const wine = await createWine({ onHand: 100 });
    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, {
        productId: wine.id, type: "AJUSTE", quantity: 88, comment: "Conteo físico",
      });
    });

    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    const movement = await prisma.inventoryMovement.findFirst({
      where: { productId: wine.id, type: "AJUSTE" },
    });

    expect(inventory?.onHand).toBe(88);
    expect(movement?.quantity).toBe(12);
    expect(movement?.comment).toBe("Conteo físico");
  });

  it("no se puede modificar stock sin dejar movimiento", async () => {
    const wine = await createWine({ onHand: 40 });
    await prisma.$transaction(async (tx) => {
      await recordMovement(tx, { productId: wine.id, type: "ENTRADA", quantity: 10 });
      await recordMovement(tx, { productId: wine.id, type: "ROTURA", quantity: 2 });
    });

    const movements = await prisma.inventoryMovement.count({ where: { productId: wine.id } });
    const inventory = await prisma.inventory.findUnique({ where: { productId: wine.id } });
    expect(movements).toBe(2);
    expect(inventory?.onHand).toBe(48);
  });
});
