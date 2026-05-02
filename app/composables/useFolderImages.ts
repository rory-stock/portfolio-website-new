import type { Ref } from "vue";
import type { DisplayImage } from "~~/types/imageTypes";

interface FolderImagesResponse {
  images: DisplayImage[];
  total: number;
  page: number;
  limit: number;
}

export function useFolderImages(
  folderId: Ref<number | null> | number,
  options: { limit?: number } = {}
) {
  const { limit = 50 } = options;

  const images = ref<DisplayImage[]>([]);
  const total = ref(0);
  const page = ref(1);
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<string | null>(null);

  const hasMore = computed(() => images.value.length < total.value);

  async function fetchImages(pageNum: number = 1, append: boolean = false) {
    const id = unref(folderId);
    if (!id) return;

    if (append) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }
    error.value = null;

    try {
      const data = await $fetch<FolderImagesResponse>(
        `/api/folders/${id}/images`,
        { query: { page: pageNum, limit } }
      );

      if (append) {
        images.value = [...images.value, ...data.images];
      } else {
        images.value = data.images;
      }

      total.value = data.total;
      page.value = pageNum;
    } catch (err: any) {
      error.value = err.data?.message || "Failed to load images";
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return;
    await fetchImages(page.value + 1, true);
  }

  async function addImage(imageInstanceId: number) {
    const id = unref(folderId);
    if (!id) return;

    try {
      await $fetch(`/api/folders/${id}/images`, {
        method: "POST",
        body: { image_instance_id: imageInstanceId },
      });

      // Refresh the full list to maintain sort order
      await fetchImages(1);
    } catch (err: any) {
      throw new Error(err.data?.message || "Failed to add image to folder");
    }
  }

  async function removeImage(imageInstanceId: number) {
    const id = unref(folderId);
    if (!id) return;

    try {
      const result = await $fetch<{
        success: boolean;
        unlinked: boolean;
        deleted_instance: boolean;
        deleted_base_image: boolean;
      }>(`/api/folders/${id}/images/${imageInstanceId}`, {
        method: "DELETE",
      });

      // Remove from local state immediately
      images.value = images.value.filter(
        (img) => img.instanceId !== imageInstanceId
      );
      total.value = Math.max(0, total.value - 1);

      return result;
    } catch (err: any) {
      throw new Error(
        err.data?.message || "Failed to remove image from folder"
      );
    }
  }

  // Auto-fetch when folderId changes
  if (isRef(folderId)) {
    watch(
      folderId,
      (newId) => {
        if (newId) {
          images.value = [];
          total.value = 0;
          page.value = 1;
          void fetchImages(1);
        } else {
          images.value = [];
          total.value = 0;
        }
      },
      { immediate: true }
    );
  } else {
    void fetchImages(1);
  }

  return {
    images,
    total,
    page,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchImages,
    loadMore,
    addImage,
    removeImage,
  };
}
