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

export interface publicNavItem {
  to: string;
  name: string;
  label: string;
}

export interface adminNavItem {
  label: string;
  path: string;
  icon: IconName;
  isPublic: boolean;
}
