import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth", "/onboarding", "/dashboard", "/chat", "/drive", "/billing", "/profile", "/plugins"],
    },
    sitemap: "https://get-cofounder.tech/sitemap.xml",
  };
}
