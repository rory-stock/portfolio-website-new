import { content } from "~~/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ContentRow = InferSelectModel<typeof content>;

export async function useContentData(table: string, immediate = false) {
  const url = `/api/content?table=${table}`;

  console.log("=== useContentData DEBUG ===");
  console.log("Table:", table);
  console.log("Server?:", import.meta.server);
  console.log("Client?:", import.meta.client);

  const { data, error, refresh } = await useAsyncData(
    `content-${table}`,
    () => $fetch<ContentRow[]>(url),
    {
      lazy: false,
      server: true,
      default: () => [],
    }
  );

  console.log("Fetched data:", data.value);
  console.log("Error:", error.value);
  console.log("===========================");

  // Transform the array to an object with just the values
  const contentMap = computed(() => {
    if (!data.value?.length) return {};
    return data.value.reduce(
      (acc, item) => {
        acc[item.key] = item.value || ""; // ADD: Fallback to empty string
        return acc;
      },
      {} as Record<string, string>
    );
  });

  if (import.meta.client) {
    watch(error, (newError) => {
      if (newError) {
        const nuxtApp = useNuxtApp();
        const toast = nuxtApp.$toast as any;
        toast?.error?.(`Failed to load content: ${newError.message}`);
      }
    });
  }

  return {
    data,
    error,
    refresh,
    content: contentMap,
  };
}
