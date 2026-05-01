/**
 * Composable for downloading images via the server proxy endpoint.
 * Handles rate limit responses with info toast and countdown.
 * Used internally by DownloadButton — not called directly by pages.
 */
export function useImageDownload() {
  const isDownloading = ref(false);
  const { info, error: showError } = useToast();

  /**
   * Download an image by instance ID.
   * Triggers a browser download via blob URL.
   */
  async function downloadImage(instanceId: number): Promise<boolean> {
    if (isDownloading.value) return false;

    isDownloading.value = true;

    try {
      const response = await $fetch.raw(`/api/images/download/${instanceId}`, {
        responseType: "blob",
      });

      const blob = response._data as unknown as Blob;

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get("content-disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "download.jpg";

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err: any) {
      // Handle rate limiting (429)
      if (err?.response?.status === 429 || err?.statusCode === 429) {
        const retryAfter =
          err?.data?.data?.retry_after ||
          err?.response?._data?.data?.retry_after ||
          60;
        const retrySeconds = Math.ceil(retryAfter);

        info(`Download rate limited — try again shortly`, retrySeconds * 1000);

        return false;
      }

      // Handle forbidden context (403)
      if (err?.response?.status === 403 || err?.statusCode === 403) {
        showError("Downloads are not available for this content");
        return false;
      }

      // Handle other errors
      const message = err?.data?.message || err?.message || "Download failed";
      showError(message);
      return false;
    } finally {
      isDownloading.value = false;
    }
  }

  return {
    isDownloading: readonly(isDownloading),
    downloadImage,
  };
}
