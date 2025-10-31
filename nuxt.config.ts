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
  app: {
    pageTransition: { name: "page", mode: "out-in" },
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
    redirectToCanonicalSiteUrl: true,
    meta: {
      author: "Rory Stock",
    },
  },
  sourcemap: {
    client: "hidden",
  },
  // ******************************************* //
});
