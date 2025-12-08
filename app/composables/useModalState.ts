import { createInjectionState } from '@vueuse/shared'

const [useProvideModalState, useModalState] = createInjectionState(
  () => {
    const isDetailModalOpen = ref(false)
    const isCleanupModalOpen = ref(false)

    const isAnyModalOpen = computed(() =>
      isDetailModalOpen.value || isCleanupModalOpen.value
    )

    return {
      isDetailModalOpen,
      isCleanupModalOpen,
      isAnyModalOpen,
    }
  }
)

export { useProvideModalState, useModalState }
