/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // ✅ Proxy cover images — endpoint: /covers/:file → backend
      {
        source: "/covers/:path*",
        destination: "http://127.0.0.1:8000/covers/:path*",
      },
      // ✅ Proxy static files (legacy support)
      {
        source: "/static/:path*",
        destination: "http://127.0.0.1:8000/static/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.sitein.id",
        pathname: "/api/v1/image-proxy/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      // ✅ Tambah backend lokal untuk dev
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/covers/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/static/**",
      },
    ],
  },
};

module.exports = nextConfig;