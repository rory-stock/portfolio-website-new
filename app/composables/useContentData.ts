import type { ContentItem } from "~~/types/api";

export function useContentData(table: string) {
  return useFetch("/api/content", {
    query: { table },
    key: `content-${table}`,
    transform: (data: ContentItem[]) => {
      if (!Array.isArray(data) || data.length === 0) return {};
      return data.reduce(
        (acc, item) => {
          acc[item.key] = item.value || "";
          return acc;
        },
        {} as Record<string, string>
      );
    },
  });
}
