import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  // *********** Basic Config Settings *********** //
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    "@nuxt/image",
    "@nuxtjs/robots",
    "@nuxtjs/sitemap",
    "nuxt-schema-org",
    "nuxt-seo-utils",
    "@nuxt/content",
    "nuxt-auth-utils",
    "@nuxt/fonts",
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["test.rorystock.com"],
    },
  },
  css: ["./app/assets/css/main.css"],
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },
  content: {
    preview: {
      api: "https://api.nuxt.studio",
    },
    database: {
      type: "d1",
      bindingName: "portfolio_db_binding",
    },
  },
  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || "",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    adminEmail: process.env.ADMIN_EMAIL,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  },
  // ******************************************* //

  //*********** Image Configuration *********** //
  image: {
    provider: "cloudflare",
    cloudflare: {
      baseURL: "https://images.rorystock.com",
    },
    domains: ["images.rorystock.com"],
    quality: 80,
    format: ["webp", "avif"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  // ******************************************* //

  // *********** Site Metadata and SEO *********** //
  site: {
    url: "https://rorystock.com",
    name: "Rory Stock",
    description: "Rory Stock is a commercial photographer based in New Zealand",
    defaultLocale: "en",
  },
  sitemap: {
    xslTips: false,
    xslColumns: [{ label: "URL", width: "50%" }],
  },
  robots: {
    blockAiBots: true,
    disallow: ["/admin", "/login"],
  },
  seo: {
    // redirectToCanonicalSiteUrl: true, TODO: Enable when using a custom domain
    meta: {
      author: "Rory Stock",
    },
  },
  sourcemap: {
    client: "hidden",
  },
  // ******************************************* //

  // ****************** UI ****************** //
  fonts: {
    families: [{ name: "Geist", provider: "google" }],
    defaults: {
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
    },
  },
  // ************************************* //
});
