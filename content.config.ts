import { defineContentConfig, defineCollection } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  collections: {
    footer: defineCollection({
      type: "data",
      source: "footer/*.json",
      schema: z.object({
        email: z.string().email(),
        location: z.string(),
        copyright: z.string(),
      }),
    }),

    profile: defineCollection({
      type: "data",
      source: "profile/*.json",
      schema: z.object({
        path: z.string(),
        alt: z.string(),
        width: z.number(),
        height: z.number(),
      }),
    }),

    // journal: defineCollection({
    //   type: "data",
    //   source: "journal/*.json",
    //   schema: z.object({
    //     path: z.string(),
    //     alt: z.string(),
    //     title: z.string().optional(),
    //     description: z.string().optional(),
    //     uploadedAt: z
    //       .string()
    //       .datetime()
    //       .default(() => new Date().toISOString()),
    //     publishedAt: z.string().datetime().optional(),
    //   }),
    // }),

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
