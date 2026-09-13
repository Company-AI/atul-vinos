"use client";

import { useMemo, useState } from "react";
import type { ProductCard } from "@/domain/catalog/types";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { formatARS } from "@/lib/money";
import { FichaV4 } from "./ficha";

/**
 * Catálogo con filtros, tal como lo resuelve el prototipo: columna de selects
 * a la izquierda, barra con el conteo y el orden arriba, grilla de tres.
 *
 * Filtra en cliente sobre el catálogo ya cargado, igual que el prototipo. Es
 * viable porque son 22 etiquetas; con un catálogo grande esto tiene que pasar
 * a filtros por URL contra el servidor, como ya hace /vinos.
 */

type Orden = "featured" | "price-asc" | "price-desc" | "newest";

/** Los datos que el prototipo muestra de cada botella. */
function datos(p: ProductCard) {
  return {
    tipo: p.wineType ? WINE_TYPE_LABELS[p.wineType] : "",
    varietal: p.grapes[0] ?? "",
    bodega: p.wineryName ?? "",
    region: p.regionName ?? "",
  };
}

function unicos(valores: string[]) {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

export function CatalogoV4({ productos }: { productos: ProductCard[] }) {
  const [tipo, setTipo] = useState("");
  const [varietal, setVarietal] = useState("");
  const [bodega, setBodega] = useState("");
  const [region, setRegion] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState<Orden>("featured");
  const [abierta, setAbierta] = useState<ProductCard | null>(null);

  const opciones = useMemo(() => {
    const d = productos.map(datos);
    return {
      tipos: unicos(d.map((x) => x.tipo)),
      varietales: unicos(d.map((x) => x.varietal)),
      bodegas: unicos(d.map((x) => x.bodega)),
      regiones: unicos(d.map((x) => x.region)),
    };
  }, [productos]);

  const visibles = useMemo(() => {
    const tope = precioMax ? Number(precioMax) : null;
    const items = productos.filter((p) => {
      const d = datos(p);
      if (tipo && d.tipo !== tipo) return false;
      if (varietal && d.varietal !== varietal) return false;
      if (bodega && d.bodega !== bodega) return false;
      if (region && d.region !== region) return false;
      if (tope !== null && Number.isFinite(tope) && p.price > tope) return false;
      return true;
    });

    if (orden === "price-asc") return [...items].sort((a, b) => a.price - b.price);
    if (orden === "price-desc") return [...items].sort((a, b) => b.price - a.price);
    if (orden === "newest")
      return [...items].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return items;
  }, [productos, tipo, varietal, bodega, region, precioMax, orden]);

  const limpiar = () => {
    setTipo("");
    setVarietal("");
    setBodega("");
    setRegion("");
    setPrecioMax("");
  };

  return (
    <>
      <div className="catalog-layout">
        <aside className="filters">
          <div className="filter-group">
            <label htmlFor="v4-tipo">Tipo</label>
            <select id="v4-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              {opciones.tipos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="v4-varietal">Varietal</label>
            <select
              id="v4-varietal"
              value={varietal}
              onChange={(e) => setVarietal(e.target.value)}
            >
              <option value="">Todos</option>
              {opciones.varietales.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="v4-bodega">Bodega</label>
            <select id="v4-bodega" value={bodega} onChange={(e) => setBodega(e.target.value)}>
              <option value="">Todas</option>
              {opciones.bodegas.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="v4-region">Región</label>
            <select id="v4-region" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Todas</option>
              {opciones.regiones.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="v4-precio">Precio máximo</label>
            <input
              id="v4-precio"
              type="number"
              min={0}
              placeholder="Sin límite"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
          </div>

          <button type="button" className="text-button" onClick={limpiar}>
            Limpiar filtros
          </button>
        </aside>

        <div className="catalog-main">
          <div className="catalog-toolbar">
            <span>
              {visibles.length} vino{visibles.length === 1 ? "" : "s"}
            </span>
            <select
              aria-label="Ordenar"
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="newest">Novedades</option>
            </select>
          </div>

          <div className="product-grid">
            {visibles.map((p) => (
              <TarjetaV4 key={p.id} producto={p} onAbrir={() => setAbierta(p)} />
            ))}
          </div>

          {visibles.length === 0 && (
            <div className="empty-state">
              <span className="empty-kicker">SIN RESULTADOS</span>
              <h3>Ninguna etiqueta coincide con ese filtro.</h3>
              <p>
                Probá con menos condiciones o subí el precio máximo. El catálogo completo
                son {productos.length} etiquetas.
              </p>
              <button type="button" className="button primary" onClick={limpiar}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <FichaV4 producto={abierta} onCerrar={() => setAbierta(null)} />
    </>
  );
}

function TarjetaV4({
  producto,
  onAbrir,
}: {
  producto: ProductCard;
  onAbrir: () => void;
}) {
  const d = datos(producto);
  const enOferta =
    producto.compareAtPrice !== null && producto.compareAtPrice > producto.price;
  const off = enOferta
    ? Math.round((1 - producto.price / producto.compareAtPrice!) * 100)
    : null;

  return (
    <article className="product-card">
      {off !== null && <span className="sale-badge">-{off}%</span>}

      <button
        type="button"
        className="product-visual js-product"
        aria-label={`Ver ${producto.name}`}
        onClick={onAbrir}
        style={{ border: 0, width: "100%", cursor: "pointer" }}
      >
        {producto.imageUrl ? (
          /*
            <img> y no next/image: la foto se dimensiona con max-width y
            max-height como en el prototipo, y `fill` necesitaría un contenedor
            posicionado que cambiaría el alto de la tarjeta.
          */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={producto.imageUrl}
            alt={producto.name}
            style={{ maxWidth: "78%", maxHeight: 225, objectFit: "contain" }}
          />
        ) : (
          <div className="product-placeholder" />
        )}
      </button>

      <div className="product-meta">
        <h3>{producto.name}</h3>
        <div className="product-sub">
          {[d.bodega, d.varietal, d.region].filter(Boolean).join(" · ")}
        </div>
        <div className="product-bottom">
          <span className="price">{formatARS(producto.price)}</span>
          <span className="stock">
            {producto.available > 0 ? `${producto.available} en stock` : "Sin stock"}
          </span>
        </div>
      </div>
    </article>
  );
}
