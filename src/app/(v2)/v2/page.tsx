import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, MapPin, Package, ShoppingCart, Truck } from "lucide-react";
import { formatARS } from "@/lib/money";

export const revalidate = 300;

/*
  Contenido de la maqueta.

  Los vinos, los precios y los textos son los de la captura del cliente, no
  los del catálogo real: la captura muestra Norton Reserva, Antología,
  Trumpeter Malbec, Rutini Cabernet Sauvignon y Norton Barrel Select, que hoy
  no están cargados, y con precios propios. Como el pedido fue reproducir la
  imagen, viven acá como datos de maqueta. Cuando esta versión se apruebe, se
  reemplazan por el catálogo.

  Las fotos de las botellas sí son reales: se bajaron de las tiendas oficiales
  de Bodega Norton y Rutini Wines, que son las bodegas que distribuimos.
*/

const SEMANA = [
  {
    marca: "Norton",
    nombre: "Reserva Malbec",
    nota: "Un Malbec que nunca falla. Ideal para una buena comida.",
    precio: 18900,
    imagen: "/media/wines/norton-reserva-malbec.png",
  },
  {
    marca: "Rutini",
    nombre: "Antología Blend",
    nota: "Un blend elegante y equilibrado, perfecto para sorprender.",
    precio: 24500,
    imagen: "/media/wines/rutini-antologia.png",
  },
  {
    marca: "Trumpeter",
    nombre: "Malbec",
    nota: "Frutado, moderno y muy disfrutable.",
    precio: 16800,
    imagen: "/media/wines/trumpeter-malbec.png",
  },
];

const CATALOGO = [
  {
    marca: "Norton",
    nombre: "Reserva Malbec",
    precio: 18900,
    imagen: "/media/wines/norton-reserva-malbec.png",
  },
  {
    marca: "Rutini",
    nombre: "Cabernet Sauvignon",
    precio: 22500,
    imagen: "/media/wines/rutini-cabernet-sauvignon.png",
  },
  {
    marca: "Trumpeter",
    nombre: "Malbec",
    precio: 16800,
    imagen: "/media/wines/trumpeter-malbec.png",
  },
  {
    marca: "Norton",
    nombre: "Barrel Select",
    precio: 28900,
    imagen: "/media/wines/norton-barrel-select.png",
  },
];

const TIPOS = [
  { label: "Tinto", cantidad: 14 },
  { label: "Blanco", cantidad: 4 },
  { label: "Rosado", cantidad: 1 },
  { label: "Espumante", cantidad: 1 },
];

const FILTROS_CERRADOS = ["Varietal", "Bodega", "Región", "Precio"];

const TIRAS = [
  {
    titulo: "Boxes",
    bajada: "Ideas listas para regalar.",
    cta: "Ver boxes",
    href: "/box",
    imagen: "/media/v2/box.webp",
    tono: "clara",
  },
  {
    titulo: "Novedades",
    bajada: "Recién llegaron a la tienda.",
    cta: "Ver novedades",
    href: "/novedades",
    imagen: "/media/v2/novedades.webp",
    tono: "oscura",
  },
  {
    titulo: "Ofertas",
    bajada: "Grandes vinos a mejores precios.",
    cta: "Ver ofertas",
    href: "/ofertas",
    imagen: "/media/v2/ofertas.webp",
    tono: "oscura",
  },
] as const;

export default function MaquetaDosPage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-texto">
            <h1>
              Vinos que probamos
              <br />
              antes de recomendar.
            </h1>
            <p>Una selección corta de etiquetas que conocemos y volveríamos a elegir.</p>
            <div className="hero-botones">
              <Link className="boton" href="/vinos">
                Ver vinos
              </Link>
              <Link className="boton linea" href="/quienes-somos">
                Conocer Atul
              </Link>
            </div>
          </div>

          <div className="hero-foto">
            <Image
              src="/media/v2/hero.webp"
              alt="Norton Reserva Malbec, Rutini Antología y Trumpeter Malbec sobre una mesa de piedra"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 55vw"
            />
            <p className="hero-firma">
              Buenas botellas,
              <br />
              mejores momentos
            </p>
          </div>
        </div>
      </section>

      {/* ─── Servicios ────────────────────────────────────────────────────── */}
      <section className="franja">
        <div className="caja franja-grid">
          <div className="franja-item">
            <Truck size={19} strokeWidth={1.5} aria-hidden />
            <span>
              Envío sin cargo en
              <br />
              Río Cuarto, Las Higueras y Holmberg
            </span>
          </div>
          <div className="franja-item">
            <MapPin size={19} strokeWidth={1.5} aria-hidden />
            <span>
              Envíos a toda Córdoba
              <br />y al centro del país
            </span>
          </div>
          <div className="franja-item">
            <Package size={19} strokeWidth={1.5} aria-hidden />
            <span>
              Retiro en depósito
              <br />
              en Río Cuarto
            </span>
          </div>
        </div>
      </section>

      {/* ─── Esta semana elegimos ─────────────────────────────────────────── */}
      <section className="semana">
        <div className="caja sec">
          <div className="sec-cab">
            <div>
              <h2>Esta semana elegimos</h2>
              <p className="sec-bajada">Tres vinos que siempre recomendamos.</p>
            </div>
            <Link className="sec-link" href="/vinos">
              Ver todos →
            </Link>
          </div>

          <div className="semana-grid">
            {SEMANA.map((v) => (
              <article className="semana-card" key={`${v.marca}-${v.nombre}`}>
                <div className="semana-foto">
                  <Image src={v.imagen} alt={`${v.marca} ${v.nombre}`} width={96} height={150} />
                </div>
                <div>
                  <p className="marca">{v.marca}</p>
                  <h3>{v.nombre}</h3>
                  <p className="nota">{v.nota}</p>
                  <p className="precio">{formatARS(v.precio)}</p>
                  <Link className="boton" href="/vinos">
                    Ver botella
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tiras ────────────────────────────────────────────────────────── */}
      <div className="caja tiras">
        {TIRAS.map((t) => (
          <Link className={`tira ${t.tono}`} href={t.href} key={t.titulo}>
            <Image src={t.imagen} alt="" fill sizes="(max-width: 860px) 100vw, 33vw" />
            <h3>{t.titulo}</h3>
            <p>{t.bajada}</p>
            <span className="mas">{t.cta} →</span>
          </Link>
        ))}
      </div>

      {/* ─── Nuestros vinos ───────────────────────────────────────────────── */}
      <section className="caja sec catalogo">
        <div className="sec-cab">
          <div>
            <h2>Nuestros vinos</h2>
            <p className="sec-bajada">Explorá toda nuestra selección.</p>
          </div>
          <label className="orden">
            Ordenar por
            <select defaultValue="destacados">
              <option value="destacados">Destacados</option>
              <option value="precio-menor">Precio: menor a mayor</option>
              <option value="precio-mayor">Precio: mayor a menor</option>
              <option value="novedades">Novedades</option>
            </select>
          </label>
        </div>

        <div className="catalogo-grid">
          <aside className="filtros">
            <div>
              <button type="button" className="filtro-cab" aria-expanded="true">
                Tipo
                <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
              </button>
              <div className="filtro-ops">
                {TIPOS.map((t) => (
                  <label key={t.label}>
                    <input type="checkbox" />
                    {t.label} ({t.cantidad})
                  </label>
                ))}
              </div>
            </div>

            {FILTROS_CERRADOS.map((f) => (
              <div key={f}>
                <button type="button" className="filtro-cab" aria-expanded="false">
                  {f}
                  <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            ))}
          </aside>

          <div className="productos">
            {CATALOGO.map((v) => (
              <article className="producto" key={`${v.marca}-${v.nombre}`}>
                <button type="button" className="favorito" aria-label={`Guardar ${v.nombre}`}>
                  <Heart size={15} strokeWidth={1.6} />
                </button>
                <div className="producto-foto">
                  <Image src={v.imagen} alt={`${v.marca} ${v.nombre}`} width={110} height={132} />
                </div>
                <p className="marca">{v.marca}</p>
                <h3>{v.nombre}</h3>
                <p className="precio">{formatARS(v.precio)}</p>
                <Link className="boton ancho" href="/vinos">
                  <ShoppingCart size={13} strokeWidth={1.8} aria-hidden />
                  Agregar
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
