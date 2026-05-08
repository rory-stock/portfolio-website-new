import type { Ref } from "vue";

interface FolderCoverImage {
  id: number;
  instanceId: number;
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface FolderData {
  id: number;
  name: string;
  slug: string;
  parent_folder_id: number | null;
  folder_type: "event" | "gallery" | "project";
  is_public: boolean;
  image_count: number;
  cover_image: FolderCoverImage | null;
  created_at: string;
  updated_at: string;
}

export function useFolder(folderId: Ref<number | null> | number) {
  const folder = ref<FolderData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchFolder() {
    const id = unref(folderId);
    if (!id) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<{ folder: FolderData }>(`/api/folders/${id}`);
      folder.value = data.folder;
    } catch (err: any) {
      error.value = err.data?.message || "Failed to load folder";
      folder.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function updateCover(coverImageId: number | null) {
    const id = unref(folderId);
    if (!id) return;

    try {
      await $fetch(`/api/folders/${id}/cover`, {
        method: "PATCH",
        body: { cover_image_id: coverImageId },
      });

      if (folder.value) {
        await fetchFolder();
      }
    } catch (err: any) {
      throw new Error(err.data?.message || "Failed to update cover");
    }
  }

  async function deleteFolder() {
    const id = unref(folderId);
    if (!id) return;

    try {
      const result = await $fetch<{
        success: boolean;
        images_processed: number;
      }>(`/api/folders/${id}`, { method: "DELETE" });
      folder.value = null;
      return result;
    } catch (err: any) {
      throw new Error(err.data?.message || "Failed to delete folder");
    }
  }

  if (isRef(folderId)) {
    watch(
      folderId,
      (newId) => {
        if (newId) void fetchFolder();
        else folder.value = null;
      },
      { immediate: true }
    );
  } else {
    void fetchFolder();
  }

  return {
    folder,
    loading,
    error,
    fetchFolder,
    updateCover,
    deleteFolder,
  };
}
