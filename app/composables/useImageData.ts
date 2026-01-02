import type { ImageBase } from "~~/types/imageTypes";

export function useImageData(context: string) {
  const images = ref<ImageBase[]>([]);
  const isLoading = ref(false);
  const fetchError = ref<string | null>(null);
  const { error: showError } = useToast();

  const fetchImages = async () => {
    isLoading.value = true;
    fetchError.value = null;

    try {
      const response = await $fetch<{ images: ImageBase[]; total: number }>(
        `/api/images?context=${context}`,
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
