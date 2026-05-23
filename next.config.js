/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Leaflet usa imports de CSS que Next.js necesita manejar
  transpilePackages: ["leaflet", "react-leaflet"],
}

module.exports = nextConfig
