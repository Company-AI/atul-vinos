/**
 * Genera imágenes placeholder PNG sin dependencias externas.
 * Sustituir por fotografía real (ver docs/ASSETS.md) — los nombres de archivo
 * se mantienen para no tener que tocar el seed.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ─── PNG encoder mínimo ──────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; // filter: none
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Utilidades de dibujo ────────────────────────────────────────────────────
const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const clamp = (v) => Math.max(0, Math.min(255, v));
// Cuantizar reduce la entropía del PNG (archivos ~5x más chicos) sin pérdida visible
const QUANT = 6;
const q = (v) => Math.round(clamp(v) / QUANT) * QUANT;

// Ruido de valor suave y determinista (sin dependencias)
function hash2(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function smoothNoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, seed, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, y * freq, seed + i * 13) * amp;
    amp *= 0.5; freq *= 2;
  }
  return sum;
}

/**
 * scene: pinta un degradado vertical con niebla, bandas de terreno y viñeta.
 */
function scene(width, height, opts) {
  const {
    sky = "#2A2521", ground = "#0D0B0A", accent = "#A9825C",
    horizon = 0.58, seed = 7, haze = 0.35, rows = 0, vignette = 0.55, grain = 3,
  } = opts;
  const top = hex(sky), bottom = hex(ground), acc = hex(accent);
  const buf = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    const ty = y / height;
    for (let x = 0; x < width; x++) {
      const tx = x / width;
      let color;

      if (ty < horizon) {
        // cielo: degradado + resplandor cálido cerca del horizonte
        const t = ty / horizon;
        color = mix(top, mix(top, acc, 0.35), Math.pow(t, 1.6));
        const glow = Math.pow(1 - Math.abs(tx - 0.5) * 1.4, 3) * Math.pow(t, 3) * 0.5;
        color = mix(color, acc, Math.max(0, glow));
      } else {
        // terreno: oscuro con textura y surcos de viñedo opcionales
        const t = (ty - horizon) / (1 - horizon);
        color = mix(mix(bottom, acc, 0.12), bottom, Math.pow(t, 0.6));
        if (rows > 0) {
          const persp = 0.15 + t * 1.0;
          const line = Math.sin((tx - 0.5) / persp * rows * Math.PI) ;
          const strength = Math.pow(t, 0.8) * 0.12;
          color = mix(color, acc, Math.max(0, line) * strength);
        }
      }

      // niebla / atmósfera
      const n = fbm(tx * 3.2, ty * 2.4, seed);
      color = mix(color, mix(color, acc, 0.5), (n - 0.5) * haze);

      // viñeta cálida
      const dx = (tx - 0.5) * 2, dy = (ty - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy) / 1.42;
      color = mix(color, hex("#0D0B0A"), Math.pow(r, 2.2) * vignette);

      // grano
      const g = (hash2(Math.floor(x / 3), Math.floor(y / 3), seed + 91) - 0.5) * grain;
      const i = (y * width + x) * 3;
      buf[i] = q(color[0] + g);
      buf[i + 1] = q(color[1] + g);
      buf[i + 2] = q(color[2] + g);
    }
  }
  return buf;
}

/**
 * bottleShot: botella centrada sobre fondo cálido, con etiqueta y reflejo.
 */
function bottleShot(width, height, opts) {
  const {
    bg = "#EFE7DA", glass = "#231A14", label = "#F4EFE4", accent = "#5E1A26",
    seed = 3, capsule = "#14110F",
  } = opts;
  const bgc = hex(bg), glassc = hex(glass), labelc = hex(label), accc = hex(accent), capc = hex(capsule);
  const buf = Buffer.alloc(width * height * 3);

  const cx = width / 2;
  const bodyTop = height * 0.30, bodyBottom = height * 0.94;
  const bodyW = width * 0.30;
  const neckTop = height * 0.06, neckW = width * 0.093;
  const shoulder = height * 0.30;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tx = x / width, ty = y / height;
      // fondo cálido con degradado suave y viñeta
      let color = mix(bgc, mix(bgc, hex("#D8CDBA"), 0.9), Math.pow(ty, 1.4) * 0.55);
      const n = fbm(tx * 2.6, ty * 2.0, seed);
      color = mix(color, hex("#C09B72"), (n - 0.5) * 0.16);
      const dx = (tx - 0.5) * 2, dy = (ty - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy) / 1.42;
      color = mix(color, hex("#8A8378"), Math.pow(r, 2.4) * 0.35);

      // sombra proyectada en la base
      const shadow = Math.max(
        0,
        1 - Math.hypot((x - cx) / (bodyW * 1.5), (y - bodyBottom + 4) / (height * 0.035)),
      );
      color = mix(color, hex("#6E675D"), Math.pow(shadow, 1.6) * 0.5);

      // silueta de la botella
      let halfW = 0;
      if (y >= neckTop && y < shoulder) {
        const t = (y - neckTop) / (shoulder - neckTop);
        halfW = (neckW + (bodyW - neckW) * Math.pow(t, 3.2)) / 2;
      } else if (y >= shoulder && y <= bodyBottom) {
        halfW = bodyW / 2;
      }

      if (halfW > 0 && Math.abs(x - cx) <= halfW) {
        const across = (x - cx) / halfW; // -1..1
        // vidrio: oscuro con especular a la izquierda y rebote a la derecha
        let g = mix(glassc, hex("#000000"), Math.pow(Math.abs(across), 2) * 0.55);
        const spec = Math.exp(-Math.pow((across + 0.45) * 4.2, 2));
        g = mix(g, hex("#C7C0B6"), spec * 0.5);
        const bounce = Math.exp(-Math.pow((across - 0.62) * 6.0, 2));
        g = mix(g, hex("#A9825C"), bounce * 0.28);
        color = g;

        // cápsula
        if (y < bodyTop * 0.62) color = mix(capc, color, 0.15 + Math.abs(across) * 0.2);

        // etiqueta
        const labTop = height * 0.52, labBottom = height * 0.80;
        if (y > labTop && y < labBottom && Math.abs(across) < 0.9) {
          let l = mix(labelc, hex("#D8CDBA"), Math.abs(across) * 0.35);
          const lt = (y - labTop) / (labBottom - labTop);
          // filete y bloque de texto simulados
          if (lt > 0.12 && lt < 0.145) l = accc;
          if (lt > 0.34 && lt < 0.40 && Math.abs(across) < 0.55) l = mix(l, hex("#14110F"), 0.75);
          if (lt > 0.46 && lt < 0.49 && Math.abs(across) < 0.35) l = mix(l, hex("#6E675D"), 0.7);
          if (lt > 0.72 && lt < 0.745) l = accc;
          color = l;
        }
      }

      const g = (hash2(Math.floor(x / 3), Math.floor(y / 3), seed + 17) - 0.5) * 3;
      const i = (y * width + x) * 3;
      buf[i] = q(color[0] + g);
      buf[i + 1] = q(color[1] + g);
      buf[i + 2] = q(color[2] + g);
    }
  }
  return buf;
}

function write(path, width, height, buf) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(width, height, buf));
  console.log(`  ✓ ${path} (${width}×${height})`);
}

// ─── Catálogo de assets ──────────────────────────────────────────────────────
console.log("Generando placeholders…");

const scenes = [
  ["public/media/hero-desktop.png", 1600, 900, { sky: "#3A2E24", ground: "#0D0B0A", accent: "#C09B72", horizon: 0.55, rows: 26, seed: 11, haze: 0.4 }],
  ["public/media/hero-mobile.png", 900, 1200, { sky: "#332822", ground: "#0D0B0A", accent: "#A9825C", horizon: 0.5, rows: 14, seed: 12, haze: 0.45 }],
  ["public/media/vineyard.png", 1400, 900, { sky: "#4A3A25", ground: "#14110F", accent: "#D2BC8A", horizon: 0.62, rows: 30, seed: 21 }],
  ["public/media/barrels.png", 1400, 900, { sky: "#2A2521", ground: "#0D0B0A", accent: "#6B5334", horizon: 0.35, seed: 33, haze: 0.5, vignette: 0.7 }],
  ["public/media/harvest.png", 1400, 900, { sky: "#5E4A2E", ground: "#1E1A17", accent: "#C0A265", horizon: 0.7, rows: 18, seed: 44 }],
  ["public/media/mountains.png", 1600, 800, { sky: "#2E3A3F", ground: "#14110F", accent: "#8A8378", horizon: 0.66, seed: 55, haze: 0.5 }],
  ["public/media/glass.png", 1200, 1200, { sky: "#1E1A17", ground: "#0D0B0A", accent: "#8C2537", horizon: 0.42, seed: 66, vignette: 0.75 }],
  ["public/media/cellar.png", 1400, 900, { sky: "#241E1A", ground: "#0D0B0A", accent: "#A9825C", horizon: 0.28, seed: 77, haze: 0.55, vignette: 0.7 }],
  ["public/media/grapes.png", 1200, 900, { sky: "#3A2A2E", ground: "#14110F", accent: "#5E1A26", horizon: 0.4, seed: 88, haze: 0.5 }],
  ["public/media/age-gate.png", 1600, 1000, { sky: "#241C17", ground: "#0D0B0A", accent: "#A9825C", horizon: 0.5, rows: 20, seed: 99, vignette: 0.7 }],
  ["public/media/club-box.png", 1400, 900, { sky: "#2A2521", ground: "#0D0B0A", accent: "#C0A265", horizon: 0.45, seed: 101, vignette: 0.65 }],
  ["public/media/og.png", 1200, 630, { sky: "#3A2E24", ground: "#0D0B0A", accent: "#C09B72", horizon: 0.55, rows: 20, seed: 111 }],
  ["public/media/story-1.png", 1200, 800, { sky: "#4A3A25", ground: "#14110F", accent: "#D2BC8A", horizon: 0.6, rows: 22, seed: 121 }],
  ["public/media/story-2.png", 1200, 800, { sky: "#2A2521", ground: "#0D0B0A", accent: "#6B5334", horizon: 0.34, seed: 131, haze: 0.5 }],
  ["public/media/story-3.png", 1200, 800, { sky: "#3A2A2E", ground: "#14110F", accent: "#8C2537", horizon: 0.45, seed: 141 }],
];

for (const [path, w, h, opts] of scenes) write(path, w, h, scene(w, h, opts));

// Botellas: la variación de color de vidrio/etiqueta distingue cada vino
const bottles = [
  ["malbec-clasico", { glass: "#281E16", accent: "#8C2537" }],
  ["malbec-reserva", { glass: "#231A14", accent: "#5E1A26" }],
  ["malbec-gran-reserva", { glass: "#1C1410", accent: "#3A1218", label: "#EFE4CE" }],
  ["cabernet-franc", { glass: "#241612", accent: "#6B1F2E" }],
  ["cabernet-sauvignon", { glass: "#1F1512", accent: "#4A1A22" }],
  ["pinot-noir", { glass: "#2E1E1A", accent: "#8C2537", label: "#F7F3EC" }],
  ["syrah", { glass: "#1A1210", accent: "#6E1C2B" }],
  ["blend-icono", { glass: "#171110", accent: "#C0A265", label: "#14110F" }],
  ["chardonnay", { glass: "#4A4227", accent: "#C0A265", label: "#F7F3EC" }],
  ["sauvignon-blanc", { glass: "#3E4A2E", accent: "#8A8378", label: "#FDFBF7" }],
  ["torrontes", { glass: "#4A4227", accent: "#D2BC8A", label: "#F1EBE0" }],
  ["rose-malbec", { glass: "#4A2E30", accent: "#A9825C", label: "#FDFBF7", bg: "#F1EBE0" }],
  ["espumante-brut-nature", { glass: "#1E2A24", accent: "#C0A265", label: "#F7F3EC", capsule: "#C0A265" }],
  ["espumante-extra-brut", { glass: "#22261F", accent: "#D2BC8A", label: "#FDFBF7", capsule: "#D2BC8A" }],
  ["naranjo-experimental", { glass: "#4A3A1E", accent: "#A9825C", label: "#F1EBE0" }],
  ["pack-degustacion", { glass: "#2A2521", accent: "#C0A265", label: "#F7F3EC", bg: "#E8DFD1" }],
  ["pack-malbec", { glass: "#231A14", accent: "#5E1A26", bg: "#E8DFD1" }],
  ["pack-asado", { glass: "#1F1512", accent: "#6B1F2E", bg: "#E8DFD1" }],
  ["pack-regalo", { glass: "#171110", accent: "#C0A265", label: "#14110F", bg: "#E8DFD1" }],
];

bottles.forEach(([slug, opts], i) =>
  write(`public/media/wines/${slug}.png`, 600, 800, bottleShot(600, 800, { ...opts, seed: 200 + i * 7 })),
);

console.log("Listo.");
