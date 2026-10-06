import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces (locale-prefixed) and the client-rendered booking flow.
        disallow: [
          "/*/login",
          "/*/register",
          "/*/dashboard",
          "/*/appointments",
          "/*/clients",
          "/*/services",
          "/*/staff",
          "/*/settings",
          "/*/s/*/book",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
