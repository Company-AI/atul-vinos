import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Imágenes propias en /public y, en producción, el bucket S3 configurado.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: process.env.S3_PUBLIC_URL
      ? [{ protocol: "https", hostname: new URL(process.env.S3_PUBLIC_URL).hostname }]
      : [],
    // No servimos SVG desde next/image: los placeholders son PNG y los logos
    // se usan como <Image> apuntando a archivos propios de /public/brand.
    dangerouslyAllowSVG: false,
  },

  // bwip-js y qrcode solo corren en el servidor (generación de etiquetas).
  serverExternalPackages: ["bwip-js"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // El admin nunca se indexa ni se cachea.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/tienda", destination: "/vinos", permanent: true },
      { source: "/suscripcion", destination: "/club", permanent: true },

      // "Packs" pasó a llamarse "Box" en el menú: los links viejos siguen vivos.
      { source: "/packs", destination: "/box", permanent: true },

      /*
        Las direcciones de diseño /v2 a /v8 se borraron al elegir una: los
        links que circularon caen en la home. Temporal, no permanente, para no
        dejar un 308 cacheado si alguna vuelve.
      */
      { source: "/v:num(\\d+)", destination: "/", permanent: false },

      // "Nuestra historia" se unificó en "Quiénes somos".
      { source: "/historia", destination: "/quienes-somos", permanent: true },

      /*
        El Club no se lanza todavía. La ruta cae en la home en lugar de dar
        404: cuando haya stock para sostenerlo, se quita este redirect y el
        motor de suscripciones ya está entero detrás.
      */
      { source: "/club", destination: "/", permanent: false },
      { source: "/club/:path*", destination: "/", permanent: false },
      { source: "/v5/:path*", destination: "/v6/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
