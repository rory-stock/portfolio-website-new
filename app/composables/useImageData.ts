import type { DisplayImage } from "~~/types/imageTypes";

export function useImageData(context: string, includeLayouts: boolean = false) {
  const images = ref<DisplayImage[]>([]);
  const isLoading = ref(false);
  const fetchError = ref<string | null>(null);
  const { error: showError } = useToast();

  const fetchImages = async () => {
    isLoading.value = true;
    fetchError.value = null;

    try {
      const params = new URLSearchParams({ context });
      if (includeLayouts) {
        params.append("include_layouts", "true");
      }

      const response = await $fetch<{ images: DisplayImage[]; total: number }>(
        `/api/images?${params.toString()}`,
        {
          headers: useRequestHeaders(["cookie"]),
        }
      );
      images.value = response.images;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load images";
      fetchError.value = message;
      showError(message);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    images,
    isLoading,
    fetchError,
    fetchImages,
  };
}

export type UseImageDataReturn = ReturnType<typeof useImageData>;
