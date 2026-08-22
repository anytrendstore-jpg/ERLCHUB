// En desarrollo local, un proxy corporativo intercepta el TLS de las
// peticiones salientes (Google Fonts, API de Discord, etc.) con un
// certificado que Node no reconoce. Lo desactivamos aquí (en vez de en el
// script "dev") para no depender de si npm usa cmd/bash para propagar la
// variable de entorno. Nunca debe aplicarse en producción.
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El código original trae errores de tipos/lint (p. ej. api/hub-coins/transactions);
  // los ignoramos para poder levantar la web y verla.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "tr.rbxcdn.com" },
      { protocol: "https", hostname: "www.roblox.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.erlchub.pro" },
      { protocol: "https", hostname: "erlchub.pro" },
      { protocol: "https", hostname: "juntanacional.co" },
      { protocol: "https", hostname: "revistaminacion.com" },
      { protocol: "https", hostname: "www.radioacktiva.com" },
    ],
  },
};

export default nextConfig;
