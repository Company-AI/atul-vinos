import { getProductDetail, listProducts } from "@/domain/catalog/service";
import { formatARS } from "@/lib/money";
import { CatalogoV4 } from "./_componentes/catalogo";

export const revalidate = 300;

/*
  Maqueta 4. Calco de la home del prototipo, sección por sección:
  hero · franja de confianza · catálogo con filtros · cajas · ofertas y
  novedades · editorial · quiénes somos.

  Los textos son los del prototipo y viven todos en COPY, acá abajo. Están
  hardcodeados a propósito mientras esto sea una maqueta para comparar, igual
  que en "/v2": cuando se elija una versión, este objeto se reemplaza por el
  bloque del CMS y deja de haber contenido en el código.
*/
const COPY = {
  heroEyebrow: "VINOTECA ESPECIALIZADA · RÍO CUARTO",
  heroTitle: "Probamos todo lo que vendemos.",
  heroText:
    "Una selección corta, elegida botella por botella. Compramos, probamos y recién después recomendamos.",
  regionsText:
    "Hoy trabajamos una selección concentrada en Mendoza, con etiquetas de Bodega Norton, Rutini Wines y Trumpeter.",
  aboutTitle: "Una vinoteca que elige antes de vender",
  aboutText:
    "Atul es una tienda especializada en vinos. No hacemos vino: lo buscamos, lo probamos y elegimos qué vale la pena ofrecer. Preferimos un catálogo corto que podamos defender antes que una góndola infinita.",
};

export default async function MaquetaCuatroPage() {
  const [catalogo, cajas] = await Promise.all([
    listProducts({ sinPacks: true, perPage: 24, orden: "destacados" }),
    listProducts({ soloPacks: true, perPage: 4, orden: "destacados" }),
  ]);

  // El prototipo lista las botellas que componen cada caja debajo del título.
  const cajasConDetalle = await Promise.all(
    cajas.items.map(async (caja) => {
      const detalle = await getProductDetail(caja.slug);
      return {
        ...caja,
        componentes:
          detalle?.packItems.map((pi) => pi.component.name).filter(Boolean) ?? [],
      };
    }),
  );

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero section-shell">
        <div className="hero-copy">
          <span className="eyebrow">{COPY.heroEyebrow}</span>
          <h1>{COPY.heroTitle}</h1>
          <p className="hero-text">{COPY.heroText}</p>
          <div className="hero-ctas">
            <a className="button primary" href="#catalogo">
              Ver vinos
            </a>
            <a className="button ghost" href="#cajas">
              Explorar cajas
            </a>
          </div>
          <div className="hero-notes">
            <span>✓ Precio visible</span>
            <span>✓ Stock claro</span>
            <span>✓ Recomendación propia</span>
          </div>
        </div>

        {/*
          Las tres botellas y el sello están dibujados con CSS, como en el
          prototipo: ahí no había fotos y la ilustración es parte del diseño.
          El proyecto tiene foto de hero real en /media/hero/: cambiar esto por
          la foto es reemplazar este bloque por un <Image fill>.
        */}
        <div className="hero-art" aria-hidden="true">
          <div className="bottle-card bottle-a">
            <span>ATUL</span>
          </div>
          <div className="bottle-card bottle-b">
            <span>SELECCIÓN</span>
          </div>
          <div className="bottle-card bottle-c">
            <span>VINOS</span>
          </div>
          <div className="hero-seal">
            Probamos todo
            <br />
            lo que vendemos
          </div>
        </div>
      </section>

      {/* ─── Franja de confianza ──────────────────────────────────────────── */}
      <section className="trust-strip">
        <div>
          <strong>Selección corta</strong>
          <span>Menos ruido, mejores decisiones.</span>
        </div>
        <div>
          <strong>Compra con criterio</strong>
          <span>No entra una botella sin probarla.</span>
        </div>
        <div>
          <strong>Envío local gratis</strong>
          <span>Río Cuarto, Las Higueras y Holmberg.</span>
        </div>
      </section>

      {/* ─── Catálogo ─────────────────────────────────────────────────────── */}
      <section className="section-shell catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2>Elegí por lo que te gusta, no por lo que te gritan.</h2>
          </div>
          <p>
            Filtrá por tipo, varietal, bodega, región y precio. Si todavía no sabés qué
            buscar, empezá por una ocasión.
          </p>
        </div>

        <CatalogoV4 productos={catalogo.items} />
      </section>

      {/* ─── Cajas ────────────────────────────────────────────────────────── */}
      <section className="section-shell boxes-section" id="cajas">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">CAJAS ARMADAS</span>
            <h2>Una idea clara detrás de cada selección.</h2>
          </div>
          <p>
            Dos o tres botellas pensadas para comparar estilos, resolver una cena o regalar
            mejor.
          </p>
        </div>

        <div className="box-grid">
          {cajasConDetalle.map((caja) => (
            <article className="box-card" key={caja.id}>
              <div>
                <span className="eyebrow">
                  CAJA · {caja.bottleCount ?? caja.componentes.length} BOTELLAS
                </span>
                <h3>{caja.name}</h3>
                <p>{caja.shortDescription}</p>
              </div>
              <div>
                <div className="box-products">{caja.componentes.join(" · ")}</div>
                <div className="product-bottom">
                  <strong>{formatARS(caja.price)}</strong>
                  <a className="button primary" href={`/vinos/${caja.slug}`}>
                    Ver caja
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Ofertas y novedades ──────────────────────────────────────────── */}
      <section className="section-shell split-section" id="ofertas">
        <div className="promo-card sale">
          <span className="eyebrow">OFERTAS</span>
          <h3>Descuentos que se entienden al primer vistazo.</h3>
          <p>
            El granate aparece sólo cuando hay una rebaja real. Sin promos disfrazadas de
            identidad.
          </p>
          <a href="/ofertas" className="inline-link">
            Ver productos con descuento →
          </a>
        </div>

        <div className="promo-card" id="novedades">
          <span className="eyebrow">NOVEDADES</span>
          <h3>Lo nuevo entra porque lo probamos, no porque llegó.</h3>
          <p>{COPY.regionsText}</p>
          <a href="/novedades" className="inline-link">
            Ver ingresos recientes →
          </a>
        </div>
      </section>

      {/* ─── Editorial ────────────────────────────────────────────────────── */}
      <section className="section-shell editorial-section">
        <div className="editorial-copy">
          <span className="eyebrow">COMPRAR MEJOR</span>
          <h2>El contenido sirve para elegir una botella.</h2>
          <p>
            En cada ficha, la descripción es nuestra: por qué la elegimos, con qué funciona
            y cuándo la abriríamos. Nada de copiar la contratapa.
          </p>
        </div>

        <div className="editorial-list">
          <article>
            <span>01</span>
            <div>
              <strong>Por qué la elegimos</strong>
              <p>La razón concreta por la que entró al catálogo.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <strong>Con qué va</strong>
              <p>Comidas y situaciones donde tiene sentido.</p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <strong>Cuándo abrirla</strong>
              <p>La ocasión antes que el ritual.</p>
            </div>
          </article>
        </div>
      </section>

      {/* ─── Quiénes somos ────────────────────────────────────────────────── */}
      <section className="section-shell about-section" id="quienes">
        <div className="about-copy">
          <span className="eyebrow">QUIÉNES SOMOS</span>
          <h2>{COPY.aboutTitle}</h2>
          <p>{COPY.aboutText}</p>
          <div className="signature">Atul</div>
        </div>

        <div className="about-facts">
          <div>
            <strong>Río Cuarto</strong>
            <span>Base y depósito.</span>
          </div>
          <div>
            <strong>Catálogo corto</strong>
            <span>Seleccionado, no acumulado.</span>
          </div>
          <div>
            <strong>Probamos antes</strong>
            <span>La compra empieza antes de la venta.</span>
          </div>
        </div>
      </section>
    </>
  );
}
