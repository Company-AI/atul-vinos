/**
 * Descarga los packshots oficiales de las bodegas que distribuimos.
 *
 *   npm run assets:packshots
 *
 * Las imágenes vienen de las tiendas oficiales de cada bodega. Como
 * distribuidores autorizados usamos su material de producto, que es la práctica
 * habitual del canal. Lo correcto a mediano plazo es pedirle a cada bodega su
 * media kit y reemplazar estos archivos conservando los nombres.
 *
 * Precios: capturados de las tiendas oficiales en agosto de 2026. Los de Rutini
 * venían por caja de 6 y en el seed están divididos por unidad. HAY QUE
 * ACTUALIZARLOS con la lista vigente del proveedor.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SHOTS = [
  // ─── Rutini Wines · Tupungato, Valle de Uco ───────────────────────────────
  { slug: "rutini-coleccion-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-Malbec_1000x1000_736daf46-1374-48fd-b511-81b737f15385.png" },
  { slug: "rutini-coleccion-cabernet-franc", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-CabernetFranc_1000x1000_b1abdc1f-6c87-439f-9292-cc108228eee7.png" },
  { slug: "rutini-coleccion-cabernet-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-CabernetMalbec_1000x1000_ed98f227-7672-4167-8835-7d5b76f5b079.png" },
  { slug: "rutini-coleccion-pinot-noir", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-PinotNoir_1000x1000_38b072f5-6abe-47dd-b287-5e9fcde71743.png" },
  { slug: "rutini-coleccion-chardonnay", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-Chardonnay_1000x1000_468aa52d-5a85-4764-9305-180fbd952cdf.png" },
  { slug: "rutini-coleccion-sauvignon-blanc", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-SauvignonBlanc_1000x1000px_copia.png" },
  { slug: "rutini-coleccion-rose-de-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/RutiniColeccion-RoseMalbec_1000x1000_09918587-10b1-42b0-8049-12c7fdfabb37.png" },
  { slug: "rutini-single-vineyard-gualtallary-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Single-Vineyard-Gualtallary-Malbec_1000x1000_e5cd5850-36fb-4b57-b01b-0950df66a6bc.png" },
  { slug: "rutini-single-vineyard-gualtallary-carmenere", url: "https://tienda.rutiniwines.com/cdn/shop/files/SingleVineyard-Gualtallary-Carmenere_1000x1000_883bd23d-b1af-4889-8141-0aeb96c77603.png" },
  { slug: "rutini-finca-centenaria-la-consulta-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Coleccion_Centenario_750ml.png" },
  { slug: "dominio-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Dominio-Malbec_1000x1000_43378567-6f53-424a-b440-5a4357deb400.png" },
  { slug: "encuentro-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Encuentro-Malbec_1000x1000_59e29141-095b-4b83-b260-233cd7c76565.png" },
  { slug: "blend-of-terroirs-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/41620_d23ef03d-73b8-4109-bffd-6fa00949c7e0.png" },

  // ─── Trumpeter · Luján de Cuyo (línea de Rutini) ──────────────────────────
  { slug: "trumpeter-reserve-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Trumpeter-Reserve-Malbec_1000x1000_05c6d322-80b7-4a00-bbcb-1e2d591d98cd.png" },
  { slug: "trumpeter-cabernet-franc", url: "https://tienda.rutiniwines.com/cdn/shop/files/Trumpeter-Cabernet-Franc_1000x1000_912c9b86-fb3c-4d17-994f-25fcfcf6b80d.png" },
  { slug: "trumpeter-reserve-rose-de-malbec", url: "https://tienda.rutiniwines.com/cdn/shop/files/Trumpeter-Reserve-Rose-de-Malbec_1000x1000_4a223bcd-c3e9-4f88-9288-56ddf50e6af6.png" },

  // ─── Bodega Norton · Luján de Cuyo ────────────────────────────────────────
  { slug: "norton-altura-malbec", url: "https://shop.norton.com.ar/cdn/shop/files/Altura-Malbec_1000x1000_4742a8c5-8b37-4abf-ad81-50ecd079ff5a.png" },
  { slug: "norton-perdriel-malbec", url: "https://shop.norton.com.ar/cdn/shop/files/Perdriel-Malbec_1000x1000_5781a816-fae2-4061-b3a2-c4be4eac7b85.png" },
  { slug: "norton-doc-malbec", url: "https://shop.norton.com.ar/cdn/shop/files/Norton-DOC-20233_1000x1000_a335ff72-310d-4362-ae87-4ea53c5b12d9.png" },
  { slug: "norton-select-malbec", url: "https://shop.norton.com.ar/cdn/shop/files/Select-Malbec_1000x1000_fbc0f81f-1c84-43a5-bfbf-6321e531703a.png" },
  { slug: "norton-talisman-malbec", url: "https://shop.norton.com.ar/cdn/shop/files/Talisman-Malbec_1000x1000_38b99029-c6f5-4c2d-8d52-7670bd939b39.png" },
  { slug: "norton-cosecha-tardia-blanco", url: "https://shop.norton.com.ar/cdn/shop/files/Cosecha_tardia_blanco_-_nueva_etiqueta.png" },
];

let ok = 0;
const failures = [];

for (const shot of SHOTS) {
  const file = `public/media/wines/${shot.slug}.png`;
  try {
    const response = await fetch(shot.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; catalogo-bodega/1.0)" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`no es una imagen (${type})`);

    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, buffer);

    console.log(`  ✓ ${shot.slug} (${Math.round(buffer.byteLength / 1024)} KB)`);
    ok++;
  } catch (error) {
    failures.push({ slug: shot.slug, reason: error.message });
    console.error(`  ✗ ${shot.slug}: ${error.message}`);
  }
}

console.log(`\n${ok}/${SHOTS.length} packshots descargados.`);
if (failures.length) {
  console.log("Fallaron:", failures.map((f) => f.slug).join(", "));
  process.exitCode = 1;
}
