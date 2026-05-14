import { useClipboard } from "@vueuse/core";

export function useShare() {
  const isSharing = ref(false);
  const { copy } = useClipboard();
  const { successMono, error: showError } = useToast();

  /**
   * Build the full shareable URL with an optional access token.
   */
  function buildShareUrl(url: string, accessToken?: string): string {
    if (!accessToken) return url;

    try {
      const parsed = new URL(url);
      parsed.searchParams.set("access", accessToken);
      return parsed.toString();
    } catch {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}access=${encodeURIComponent(accessToken)}`;
    }
  }

  /**
   * Share a URL using the Web Share API (mobile) or clipboard (desktop).
   *
   * @param url - The full URL to share (required)
   * @param accessToken - Optional access token to append as ?access=<token>
   * @returns true if shared successfully, false otherwise
   */
  async function share(url: string, accessToken?: string): Promise<boolean> {
    if (!url) {
      showError("No URL provided to share");
      return false;
    }

    if (isSharing.value) return false;

    isSharing.value = true;
    const shareUrl = buildShareUrl(url, accessToken);

    try {
      if (navigator.share) {
        await navigator.share({ url: shareUrl });
        return true;
      }

      await copy(shareUrl);
      successMono("Link copied");
      return true;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return false;
      }
      
      showError("Failed to share link");
      return false;
    } finally {
      isSharing.value = false;
    }
  }

  return {
    share,
    isSharing: readonly(isSharing),
  };
}
