import { defineContentConfig, defineCollection } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: "page",
      source: "*.md",
    }),

    footer: defineCollection({
      type: "data",
      source: "footer/*.json",
      schema: z.object({
        email: z.string().email(),
        location: z.string(),
        copyright: z.string(),
      }),
    }),

    images: defineCollection({
      type: "data",
      source: "images/*.json",
      schema: z.object({
        path: z.string(),
        alt: z.string(),
        type: z.enum(["portfolio", "journal", "profile"]),

        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        order: z.number().optional(),

        width: z.number().optional(),
        height: z.number().optional(),

        uploadedAt: z
          .string()
          .datetime()
          .default(() => new Date().toISOString()),
        publishedAt: z.string().datetime().optional(),
      }),
    }),

    contactInfo: defineCollection({
      type: "data",
      source: "info/*.json",
      schema: z.object({
        contactHeader: z.string(),
        contactCta: z.string(),
        contactEmail: z.string().email(),
        bio: z.string(),
      }),
    }),
  },
});
