import type { IconName } from "~/components/icons/iconData";

export interface PageConfig {
  label: string;
  publicPath: string;
  publicRouteName: string;
  adminPath: string;
  icon: IconName;
  isPublic: boolean;
  context: string;
}

const pages: PageConfig[] = [
  {
    label: "Overview",
    publicPath: "/",
    publicRouteName: "index",
    adminPath: "/admin",
    icon: "overview",
    isPublic: true,
    context: "overview",
  },
  {
    label: "Events",
    publicPath: "/events",
    publicRouteName: "events",
    adminPath: "/admin/events",
    icon: "event",
    isPublic: true,
    context: "events",
  },
  {
    label: "Personal",
    publicPath: "/personal",
    publicRouteName: "personal",
    adminPath: "/admin/personal",
    icon: "journal",
    isPublic: true,
    context: "personal",
  },
  {
    label: "Info",
    publicPath: "/info",
    publicRouteName: "info",
    adminPath: "/admin/info",
    icon: "globe",
    isPublic: true,
    context: "info",
  },
];

export const PAGE_CONTEXTS = pages.map((p) => p.context) as string[];

export const headerTransparentRoutes = ["index"];

export const useNavigation = () => {
  // For public header navigation (DesktopNav, MobileMenu)
  const publicNavItems = computed(() =>
    pages
      .filter((p) => p.isPublic)
      .map((p) => ({
        to: p.publicPath,
        name: p.publicRouteName,
        label: p.label,
      }))
  );

  // For admin sidebar page navigation
  const adminPageItems = computed(() =>
    pages.map((p) => ({
      label: p.label,
      path: p.adminPath,
      icon: p.icon,
      isPublic: p.isPublic,
    }))
  );

  return {
    pages,
    publicNavItems,
    adminPageItems,
  };
};
