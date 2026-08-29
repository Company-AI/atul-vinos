/**
 * Descarga las fotos y videos de demostración desde Pexels.
 *
 *   npm run assets:stock
 *
 * Licencia: contenido de Pexels bajo la licencia de Pexels — uso gratuito,
 * comercial incluido, sin atribución obligatoria, sin reventa del archivo tal
 * cual. Ver https://www.pexels.com/license/
 *
 * SON PLACEHOLDERS: la idea es reemplazarlos por la fotografía y el video
 * propios de la bodega. Al hacerlo, conservá los nombres de archivo y no hace
 * falta tocar nada más (o cambialos desde Admin > Contenido).
 *
 * Los créditos se escriben en public/media/CREDITS.md.
 *
 * REGLA AL ELEGIR FOTOS DE PRODUCTO: la etiqueta no puede ser legible. Mostrar
 * botellas de otras bodegas como si fueran propias induce a error al comprador
 * y es un problema de marcas. Se eligen botellas sin etiqueta, etiquetas fuera
 * de foco o copas.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const PHOTOS = [
  // ─── Escenas ──────────────────────────────────────────────────────────────
  { id: 2331884, file: "public/media/scenes/hero-vineyard-mountains.jpg", w: 1920, title: "Viñedo al pie de la montaña" },
  { id: 5370804, file: "public/media/scenes/vineyard-rows.jpg", w: 1600, title: "Hileras de viñedo" },
  { id: 11566340, file: "public/media/scenes/vineyard-valley.jpg", w: 1600, title: "Valle con viñedos" },
  { id: 842711, file: "public/media/scenes/mountains.jpg", w: 1920, title: "Sierras" },
  { id: 17765439, file: "public/media/scenes/barrels.jpg", w: 1600, title: "Barricas apiladas" },
  { id: 30654296, file: "public/media/scenes/cellar.jpg", w: 1600, title: "Nave de crianza" },
  { id: 5537784, file: "public/media/scenes/barrels-storage.jpg", w: 1600, title: "Barricas en depósito" },
  { id: 3842606, file: "public/media/scenes/harvest.jpg", w: 1600, title: "Cosecha en cajones" },
  { id: 18478446, file: "public/media/scenes/grapes.jpg", w: 1600, title: "Uvas cosechadas" },
  { id: 20188275, file: "public/media/scenes/grapes-cluster.jpg", w: 1400, title: "Racimo de uvas" },
  { id: 6058230, file: "public/media/scenes/glass-dark.jpg", w: 1400, title: "Copa de vino sobre negro" },
  { id: 312080, file: "public/media/scenes/pouring.jpg", w: 1600, title: "Sirviendo vino" },
  { id: 30279443, file: "public/media/scenes/pouring-dark.jpg", w: 1920, title: "Sirviendo vino, fondo oscuro" },
  { id: 94437, file: "public/media/scenes/bottle-glass-dark.jpg", w: 1600, title: "Botella y copa" },

  // ─── Botellas por tipo de vino ────────────────────────────────────────────
  { id: 94437, file: "public/media/wines/tinto.jpg", w: 1000, title: "Botella de tinto" },
  { id: 121191, file: "public/media/wines/tinto-alt.jpg", w: 1000, title: "Botella sobre madera" },
  { id: 10012572, file: "public/media/wines/blanco.jpg", w: 1000, title: "Vino blanco" },
  { id: 375839, file: "public/media/wines/rosado.jpg", w: 1000, title: "Rosado" },
  { id: 11976218, file: "public/media/wines/espumante.jpg", w: 1000, title: "Copas de espumante" },
  { id: 30269757, file: "public/media/wines/naranjo.jpg", w: 1000, title: "Copa, alta gama" },
  { id: 8775181, file: "public/media/wines/pack.jpg", w: 1000, title: "Brindis con copas de tinto" },
];

/**
 * Pexels expone varias resoluciones por video con el patrón
 *   {id}-{tier}_{ancho}_{alto}_{fps}fps.mp4
 * Los clips verticales invierten ancho y alto, así que las variantes se
 * derivan de la orientación del archivo canónico.
 */
const TIERS = {
  "720": { landscape: "hd_1280_720", portrait: "hd_720_1280" },
  "540": { landscape: "sd_960_540", portrait: "sd_540_960" },
  "360": { landscape: "sd_640_360", portrait: "sd_360_640" },
};

const VIDEOS = [
  {
    id: 3775895,
    title: "Drone sobre el viñedo de una bodega",
    variants: [
      { file: "public/media/video/hero-desktop.mp4", prefer: ["720", "540"], maxBytes: 7_000_000 },
      { file: "public/media/video/hero-mobile.mp4", prefer: ["360", "540"], maxBytes: 2_500_000 },
    ],
  },
  {
    id: 1003933,
    title: "Vino tinto sirviéndose en la copa",
    variants: [
      { file: "public/media/video/club-desktop.mp4", prefer: ["720", "540"], maxBytes: 7_000_000 },
    ],
  },
  {
    // Vertical: ideal como fuente mobile del hero del Club.
    id: 8093235,
    title: "Vino sirviéndose, plano vertical",
    variants: [
      { file: "public/media/video/club-mobile.mp4", prefer: ["360", "540"], maxBytes: 3_000_000 },
    ],
  },
];

const photoUrl = (id, w) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&dpr=1`;

async function save(url, file) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, buffer);
  return buffer.byteLength;
}

/** Lee el archivo canónico para deducir fps y orientación de las variantes. */
async function resolveVideoMeta(id) {
  const response = await fetch(`https://www.pexels.com/download/video/${id}/`, {
    redirect: "manual",
  });
  const location = response.headers.get("location") ?? "";
  const match = location.match(/-\w+_(\d+)_(\d+)_(\d+)fps\.mp4/);
  if (!match) return null;
  const [, width, height, fps] = match;
  return {
    fps,
    orientation: Number(width) < Number(height) ? "portrait" : "landscape",
  };
}

async function head(url) {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) return null;
  return Number(response.headers.get("content-length") ?? 0);
}

const credits = [];
let failures = 0;

console.log("Descargando fotografías…");
for (const photo of PHOTOS) {
  try {
    const bytes = await save(photoUrl(photo.id, photo.w), photo.file);
    console.log(`  ✓ ${photo.file} (${Math.round(bytes / 1024)} KB)`);
    credits.push({
      file: photo.file.replace("public/", ""),
      title: photo.title,
      source: `https://www.pexels.com/photo/${photo.id}/`,
    });
  } catch (error) {
    failures++;
    console.error(`  ✗ ${photo.file}: ${error.message}`);
  }
}

console.log("\nDescargando videos…");
for (const video of VIDEOS) {
  const meta = await resolveVideoMeta(video.id);
  if (!meta) {
    failures++;
    console.error(`  ✗ video ${video.id}: no se pudo resolver el archivo`);
    continue;
  }

  for (const variant of video.variants) {
    let chosen = null;
    for (const tier of variant.prefer) {
      const quality = TIERS[tier][meta.orientation];
      const url = `https://videos.pexels.com/video-files/${video.id}/${video.id}-${quality}_${meta.fps}fps.mp4`;
      const size = await head(url);
      if (size && size <= variant.maxBytes) {
        chosen = { url, size, quality };
        break;
      }
      if (size) console.log(`    · ${quality}: ${Math.round(size / 1024)} KB supera el límite`);
    }

    if (!chosen) {
      failures++;
      console.error(`  ✗ ${variant.file}: ninguna variante entra en el presupuesto de peso`);
      continue;
    }

    try {
      const bytes = await save(chosen.url, variant.file);
      console.log(`  ✓ ${variant.file} — ${chosen.quality} (${Math.round(bytes / 1024)} KB)`);
      credits.push({
        file: variant.file.replace("public/", ""),
        title: video.title,
        source: `https://www.pexels.com/video/${video.id}/`,
      });
    } catch (error) {
      failures++;
      console.error(`  ✗ ${variant.file}: ${error.message}`);
    }
  }
}

const creditsFile = `# Créditos de la media de demostración

Todo el material de esta carpeta viene de **Pexels** y está bajo la
[licencia de Pexels](https://www.pexels.com/license/): uso gratuito, también
comercial, sin atribución obligatoria. No se puede revender el archivo tal cual
ni usar personas identificables de forma que sugiera que respaldan la marca.

**Son placeholders.** La idea es reemplazarlos por fotografía y video propios de
la bodega. Si conservás los nombres de archivo no hace falta tocar código; si
preferís otros, cambiá las rutas desde **Admin > Contenido**.

Regenerar con:

    npm run assets:stock

| Archivo | Contenido | Fuente |
|---|---|---|
${credits.map((c) => `| \`${c.file}\` | ${c.title} | ${c.source} |`).join("\n")}
`;

await writeFile("public/media/CREDITS.md", creditsFile);

console.log(
  `\n${credits.length} archivos descargados, ${failures} con error. Créditos en public/media/CREDITS.md`,
);
if (failures > 0) process.exitCode = 1;
