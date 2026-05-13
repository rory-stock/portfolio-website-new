import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

export function useResponsive() {
  const breakpoints = useBreakpoints(breakpointsTailwind);
  const isMobile = breakpoints.smaller("md");
  const isTablet = breakpoints.between("md", "lg");
  const isTabletOrSmaller = breakpoints.smaller("lg");
  const isDesktop = breakpoints.greaterOrEqual("lg");

  return {
    isMobile,
    isTablet,
    isTabletOrSmaller,
    isDesktop,
  };
}
