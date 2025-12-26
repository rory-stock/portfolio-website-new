import { content } from "~~/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ContentRow = InferSelectModel<typeof content>;

export async function useContentData(table: string, immediate = false) {
  const url = `/api/content?table=${table}`;

  const result = await useAsyncData(
    `content-${table}`,
    () => $fetch<ContentRow[]>(url),
    {
      server: immediate,
      lazy: false,
    }
  );

  // Transform array to object with just the values
  const contentMap = computed(() => {
    if (!result.data.value?.length) return {};
    return result.data.value.reduce(
      (acc, item) => {
        acc[item.key] = item.value; // Just store the value string, not the whole object
        return acc;
      },
      {} as Record<string, string>
    );
  });

  if (import.meta.client) {
    watch(result.error, (newError) => {
      if (newError) {
        const nuxtApp = useNuxtApp();
        const toast = nuxtApp.$toast as any;
        toast?.error?.(`Failed to load content: ${newError.message}`);
      }
    });
  }

  return {
    ...result,
    content: contentMap,
  };
}
