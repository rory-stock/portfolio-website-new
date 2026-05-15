import type {
  PageConfig,
  adminNavItem,
  publicNavItem,
} from "~~/types/navTypes";
import { computed } from "vue";
import type { ComputedRef } from "vue";

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
    isPublic: false,
    context: "events",
  },
  {
    label: "Galleries",
    publicPath: "/gallery",
    publicRouteName: "gallery",
    adminPath: "/admin/galleries",
    icon: "file",
    isPublic: false,
    context: "galleries",
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
  const publicNavItems: ComputedRef<publicNavItem[]> = computed(() =>
    pages
      .filter((p) => p.isPublic)
      .map((p) => ({
        to: p.publicPath,
        name: p.publicRouteName,
        label: p.label,
      }))
  );

  // For events page navigation
  const eventsNavItems: ComputedRef<publicNavItem[]> = computed(() => [
    {
      to: "/events",
      name: "events",
      label: "Events",
    },
    {
      to: "/",
      name: "index",
      label: "Portfolio",
    },
  ]);

  // For gallery page navigation
  const galleryNavItems: ComputedRef<publicNavItem[]> = computed(() => [
    {
      to: "/",
      name: "index",
      label: "Portfolio",
    }
  ])

  // For admin sidebar page navigation
  const adminPageItems: ComputedRef<adminNavItem[]> = computed(() =>
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
    eventsNavItems,
    galleryNavItems,
    adminPageItems,
  };
};
