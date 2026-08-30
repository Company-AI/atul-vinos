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

      /*
        Las direcciones de diseño se numeraron /v2 /v3 /v4 /v6 /v7: nunca hubo
        una v5. En vez de renumerar y romper los links que ya circulan, /v5
        cae en la variante siguiente para que nadie se coma un 404.

        Temporal a propósito: cuando se elija una dirección, estas rutas se van
        y un 308 quedaría cacheado en el navegador apuntando a una URL muerta.
      */
      { source: "/v5", destination: "/v6", permanent: false },
      { source: "/v5/:path*", destination: "/v6/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
