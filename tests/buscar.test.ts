import { describe, expect, it } from "vitest";
import { coincideBusqueda, normalizarBusqueda } from "@/lib/buscar";

describe("búsqueda del panel", () => {
  it("ignora las tildes en los dos lados", () => {
    expect(coincideBusqueda("carmenere", "Rutini Single Vineyard Carménère")).toBe(true);
    expect(coincideBusqueda("Carménère", "rutini carmenere")).toBe(true);
  });

  it("ignora mayúsculas y espacios sobrantes", () => {
    expect(coincideBusqueda("  MALBEC ", "Norton D.O.C Malbec")).toBe(true);
  });

  it("busca también por SKU, con guiones y todo", () => {
    expect(coincideBusqueda("nor-doc", "Norton D.O.C Malbec", "NOR-DOC-MLB")).toBe(true);
  });

  it("no inventa coincidencias", () => {
    expect(coincideBusqueda("syrah", "Norton D.O.C Malbec", "NOR-DOC-MLB")).toBe(false);
  });

  it("con la consulta vacía entra todo, para no esconder la lista al abrirla", () => {
    expect(coincideBusqueda("", "cualquier cosa")).toBe(true);
    expect(coincideBusqueda("   ", "cualquier cosa")).toBe(true);
  });

  it("conserva guiones y espacios, que slugify se llevaría puestos", () => {
    expect(normalizarBusqueda("NOR-DOC MLB")).toBe("nor-doc mlb");
  });
});
