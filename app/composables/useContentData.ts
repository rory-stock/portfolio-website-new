import { eq } from "drizzle-orm";
import { content } from "~~/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useDB } from "~~/server/db/client";

type ContentRow = InferSelectModel<typeof content>;

export async function useContentData(table: string, immediate = false) {
  const { data, error, refresh } = await useAsyncData(
    `content-${table}`,
    async () => {
      // During SSR, access DB directly
      if (import.meta.server) {
        const event = useRequestEvent();
        if (!event) return [];

        try {
          const db = useDB(event);
          return await db
            .select()
            .from(content)
            .where(eq(content.table, table));
        } catch (e) {
          console.error("DB access error:", e);
          return [];
        }
      }

      // On client, use API
      return $fetch<ContentRow[]>(`/api/content?table=${table}`);
    },
    {
      lazy: false,
      server: true,
      default: () => [],
    }
  );

  // Transform the array to an object with just the values
  const contentMap = computed(() => {
    if (!data.value?.length) return {};
    return data.value.reduce(
      (acc, item) => {
        acc[item.key] = item.value || "";
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
