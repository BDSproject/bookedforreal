import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve AVIF/WebP with a fallback for older clients.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      // 301 redirects for changed salon slugs (legacy → new).
      // In production, generate these from a slug-history table at build time.
      { source: "/fr/s/demo-salon", destination: "/fr/s/paris-marais", permanent: true },
      { source: "/en/s/demo-salon", destination: "/en/s/paris-marais", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
