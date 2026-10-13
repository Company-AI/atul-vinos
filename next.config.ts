import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // El deploy es una imagen Docker en VPS: `standalone` empaqueta el server
  // con sólo las dependencias que el trace encuentra, sin node_modules entero.
  output: "standalone",

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
      {
        /*
          El webhook de pagos tampoco se cachea. Estaba declarado sólo en
          netlify.toml, que Vercel ignora: ahí una respuesta cacheada podría
          hacer que un pago se dé por procesado sin haberlo procesado. Acá
          vale en cualquier host.
        */
        source: "/api/webhooks/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
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
        /v2 es la única maqueta que convive con la de "/". El resto se
        borraron y sus rutas caen en la home.
      */
      { source: "/v:num(3|4|5|6|7|8)", destination: "/", permanent: false },

      // "Nuestra historia" se unificó en "Quiénes somos".
      { source: "/historia", destination: "/quienes-somos", permanent: true },

      /*
        El Club ya no se esconde desde acá. Estaba resuelto con un redirect
        estático, y eso obligaba a tocar código y redeployar para volver a
        mostrarlo. Ahora lo decide `club.enabled` en Configuración: apagado,
        /club da 404 y el Club desaparece del pie, del menú y del FAQ.
      */
      { source: "/v5/:path*", destination: "/v6/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
