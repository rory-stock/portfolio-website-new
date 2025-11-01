import { defineContentConfig, defineCollection, property } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: "page",
      source: "*.md",
    }),

    // *********** Footer Content *********** //
    footer: defineCollection({
      type: "data",
      source: "footer/**.json",
      schema: z.object({
        email: z.string().email(),
        location: z.string(),
        copyright: z.string(),
      }),
    }),
    // ************************************** //
  },
});
