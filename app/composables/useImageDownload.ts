/**
 * Composable for downloading images via the server proxy endpoint.
 * Handles rate limit responses with info toast and countdown.
 * Used internally by DownloadButton — not called directly by pages.
 *
 * iOS flow: Opens the image in a new tab for long-press saving,
 * with a first-time prompt explaining the process.
 *
 * Desktop/Android flow: Standard blob download triggering a file save.
 */

// Module-level state — persists across navigation, resets on hard refresh
const hasSeenIosPrompt = ref(false);

/**
 * Detect iOS devices (iPhone, iPad in mobile Safari)
 */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function useImageDownload() {
  const isDownloading = ref(false);
  const { info, error: showError } = useToast();

  /**
   * Download an image by instance ID.
   * Branches between iOS and desktop/Android.
   */
  async function downloadImage(instanceId: number): Promise<boolean> {
    if (isDownloading.value) return false;

    // iOS flow
    if (isIos()) {
      return handleIosDownload(instanceId);
    }

    // Desktop / Android flow
    return handleStandardDownload(instanceId);
  }

  /**
   * iOS
   */
  function handleIosDownload(instanceId: number): boolean {
    if (!hasSeenIosPrompt.value) {
      const proceed = window.confirm(
        "A new window with the photo will open. Press and hold the photo for the option to save."
      );

      if (!proceed) return false;

      hasSeenIosPrompt.value = true;
    }

    // Open the image inline in a new tab
    window.open(`/api/images/download/${instanceId}?view=true`, "_blank");
    return true;
  }

  /**
   * Desktop / Android
   */
  async function handleStandardDownload(instanceId: number): Promise<boolean> {
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
      return handleDownloadError(err);
    } finally {
      isDownloading.value = false;
    }
  }

  /**
   * Shared error handler for download failures.
   */
  function handleDownloadError(err: any): false {
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
  }

  return {
    isDownloading: readonly(isDownloading),
    downloadImage,
  };
}
