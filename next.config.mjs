/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // firebase-admin adalah paket khusus server; jangan di-bundle ke sisi klien.
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

export default nextConfig;
