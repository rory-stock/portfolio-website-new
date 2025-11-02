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
    "@nuxt/content",
    "@nuxt/image",
    "@nuxtjs/robots",
    "@nuxtjs/sitemap",
    "nuxt-schema-org",
    "nuxt-seo-utils",
  ],
  vite: { plugins: [tailwindcss()] },
  css: ['./app/assets/css/main.css'],
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },
  content: {
    preview: {
      api: 'https://api.nuxt.studio'
    },
    database: {
      type: 'd1',
      bindingName: 'portfolio_db_binding',
    },
  },
  // ******************************************* //

  //*********** Image Configuration *********** //
  image: {
    provider: 'ipx',
    domains: ['images.rorystock.com'],
    alias: {
      r2: "https://images.rorystock.com/rebuild",
    },
    quality: 80,
    format: ['webp', 'avif'],
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
});
