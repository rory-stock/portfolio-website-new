export function useErrorPage() {
  const route = useRoute();
  const { loggedIn } = useUserSession();

  // Detect context
  const isAdminPage = computed(() => route.path.startsWith("/admin"));
  const isLoginPage = computed(() => route.path === "/login");
  const isDarkMode = computed(() => isAdminPage.value || isLoginPage.value);

  // Recovery hints for 404 errors
  const recoveryHints: Record<string, string> = {
    "/evnts": "/events",
    "/event": "/events",
    "/journl": "/journal",
    "/jornal": "/journal",
    "/jrnl": "/journal",
    "/infos": "/info",
    "/information": "/info",
    "/admon": "/admin",
    "/amin": "/admin",
    "/admn": "/admin",
    "/overvew": "/",
    "/overviw": "/",
    "/hom": "/",
    "/index": "/",
  };

  function getSuggestedPage(path: string): string | null {
    // Direct match
    if (recoveryHints[path]) {
      return recoveryHints[path];
    }

    // Fuzzy match
    const validPaths = ["/", "/events", "/journal", "/info", "/admin"];
    const cleanPath = path.toLowerCase().replace(/\/$/, "");

    for (const validPath of validPaths) {
      const distance = levenshteinDistance(cleanPath, validPath);
      if (distance <= 2) {
        // Allow 2-character difference
        return validPath;
      }
    }

    return null;
  }

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(0));

    // Initialize the first column and row
    for (let i = 0; i <= b.length; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0]![j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }

    return matrix[b.length]![a.length]!;
  }

  function getErrorTitle(statusCode: number): string {
    if (statusCode === 404) return "Page Not Found";
    if (statusCode === 403) return "Access Forbidden";
    if (statusCode >= 500) return "Server Error";
    return "An Error Occurred";
  }

  function getErrorMessage(statusCode: number, message?: string): string {
    if (message) return message;
    if (statusCode === 404) return "This page doesn't exist";
    if (statusCode === 403)
      return "You don't have permission to view this page";
    if (statusCode >= 500) return "Something went wrong on our end";
    return "An unexpected error occurred";
  }

  return {
    isAdminPage,
    isLoginPage,
    isDarkMode,
    loggedIn,
    getSuggestedPage,
    getErrorTitle,
    getErrorMessage,
  };
}
