import { field, group } from "@nuxt/content/preview";

export default defineNuxtSchema({
  appConfig: {
    // ************ Site Metadata *********** //
    seo: group({
      title: "SEO Settings",
      description: "Configure global SEO settings for the site",
      fields: {
        name: field({
          type: "string",
          title: "Site Name",
          description: "Global Site Name",
          default: "Rory Stock",
        }),
        description: field({
          type: "string",
          title: "Parent Description",
          description: "Parent Description",
          default:
            "Rory Stock is a commercial photographer based in New Zealand",
        }),
      },
    }),
    // ************************************** //

    // ************ Site Theme ************ //
    theme: group({
      title: "Theme Settings",
      description: "Configure global theme settings for the site",
      fields: {
        backgroundColor: field({
          type: "string",
          title: "Body Color",
          description: "Global body background color",
          default: "#ffffff",
        }),
        htmlBackgroundColor: field({
          type: "string",
          title: "HTML Background Color",
          description: "Global HTML background color",
          default: "#000000",
        }),
      },
    }),
    // ************************************** //
  },
});
