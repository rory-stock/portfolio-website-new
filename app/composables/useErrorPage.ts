import type { IconName } from "~/components/icons/iconData";

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
        return validPath;
      }
    }

    return null;
  }

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= b.length; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0]![j] = j;
    }

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

  function getErrorMessage(statusCode: number, message?: string): string {
    if (message) return message;
    if (statusCode === 404) return "This page doesn't exist";
    if (statusCode === 403)
      return "You don't have permission to view this page";
    if (statusCode >= 500) return "Something went wrong on our end";
    return "An unexpected error occurred";
  }

  // Action builder types
  interface Action {
    label: string;
    icon: IconName;
    onClick?: () => void;
    href?: string;
  }

  interface ErrorActionHandlers {
    goBack: () => void;
    retry: () => void;
    goHome: () => void;
    goAdmin: () => void;
    reportIssue: () => void;
  }

  // Build actions based on context
  function buildActions(
    statusCode: number,
    isAdmin: boolean,
    handlers: ErrorActionHandlers
  ): Action[] {
    const actions: Action[] = [
      { label: "Go Back", icon: "back", onClick: handlers.goBack },
    ];

    if (statusCode >= 500) {
      actions.push({
        label: "Try Again",
        icon: "refresh",
        onClick: handlers.retry,
      });
    }

    if (isAdmin) {
      actions.push({
        label: "Admin Dashboard",
        icon: "back",
        onClick: handlers.goAdmin,
      });
    }

    actions.push({
      label: "Home",
      icon: "back",
      onClick: handlers.goHome,
    });

    actions.push({
      label: "Report Issue",
      icon: "back",
      onClick: handlers.reportIssue,
    });

    return actions;
  }

  // Theme class utilities
  function getThemeClasses(isDark: boolean) {
    return {
      // ErrorHeader classes
      header: {
        code: isDark
          ? "text-neutral-200 font-ibm-plex-sans text-[8rem] leading-33 lg:text-[12rem] lg:leading-50"
          : "font-ghost text-black fixed right-0 bottom-0 text-[8rem] leading-30 md:text-[15rem] md:leading-60 lg:text-[18rem] lg:leading-70 xl:text-[22rem] xl:leading-80",
        title: isDark
          ? "text-neutral-200 font-ibm-plex-sans flex gap-4 text-3xl md:text-4xl"
          : "font-ghost text-black fixed flex flex-col left-5 top-2 xs:text-4xl lg:top-3 sm:text-5xl md:text-8xl",
        message: isDark
          ? "font-ibm-plex-sans text-neutral-400 text-lg md:text-xl"
          : "font-ghost text-black fixed left-5 top-22 md:top-38 text-lg md:text-2xl xl:text-4xl",
      },
      // ErrorActions classes
      actions: {
        container: isDark ? "" : "fixed left-5 top-36 md:top-60",
        number: isDark ? "text-neutral-600" : "text-neutral-400",
        label: isDark ? "text-neutral-200" : "text-neutral-800",
        icon: isDark
          ? "text-neutral-600 group-hover:text-neutral-200"
          : "text-neutral-400 group-hover:text-neutral-800",
        border: isDark ? "border-neutral-700" : "border-neutral-800",
      },
      // RecoveryHint classes
      recovery: {
        text: isDark ? "text-neutral-400" : "text-neutral-980 fixed left-5 top-32 md:top-54 xl:text-xl",
      },
    };
  }

  return {
    isAdminPage,
    isLoginPage,
    isDarkMode,
    loggedIn,
    getSuggestedPage,
    getErrorMessage,
    buildActions,
    getThemeClasses,
  };
}
