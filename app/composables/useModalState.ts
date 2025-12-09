import { createInjectionState } from "@vueuse/shared";

const [useProvideModalState, useInjectModalState] = createInjectionState(() => {
  const isDetailModalOpen = ref(false);
  const isCleanupModalOpen = ref(false);

  const isAnyModalOpen = computed(
    () => isDetailModalOpen.value || isCleanupModalOpen.value
  );

  return {
    isDetailModalOpen,
    isCleanupModalOpen,
    isAnyModalOpen,
  };
});

// Export a safe version that always returns a value
export { useProvideModalState };

export const useModalState = () => {
  const state = useInjectModalState();

  // Provide fallback for SSR or when no provider exists
  if (!state) {
    return {
      isDetailModalOpen: ref(false),
      isCleanupModalOpen: ref(false),
      isAnyModalOpen: ref(false),
    };
  }

  return state;
};
