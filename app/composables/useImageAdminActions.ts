import type { MultiAction } from "~~/types/multiActions";
import type { DisplayImage } from "~~/types/imageTypes";

interface UseImageAdminActionsOptions {
  context: string;
  images: Ref<DisplayImage[]>;
  onActionComplete?: () => Promise<void>;
}

export function useImageAdminActions(options: UseImageAdminActionsOptions) {
  const { context, images, onActionComplete } = options;
  const { success, error: showError } = useToast();

  // Multi-select
  const {
    selectedImageIds,
    isSelectionMode,
    hasSelection,
    selectedCount,
    selectedImages,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    enterSelectionMode,
    exitSelectionMode,
    selectRange,
    selectByFilter,
  } = useMultiSelect({ images });

  // Multi-actions
  const { actions, getAllWarnings } = useMultiActions(context);

  // Delayed operations
  const { scheduleOperation } = useDelayedOperation();

  // Confirmation modal state
  const showConfirmModal = ref(false);
  const pendingAction = ref<MultiAction | null>(null);
  const pendingWarnings = ref<string[]>([]);
  const isExecuting = ref(false);

  // Computed confirmation content
  const confirmationContent = computed(() => {
    if (!pendingAction.value) {
      return { title: "", message: "", confirmLabel: "Confirm" };
    }

    if (pendingAction.value.getConfirmation) {
      return pendingAction.value.getConfirmation(selectedImages.value);
    }

    return {
      title: pendingAction.value.label,
      message: `Are you sure you want to ${pendingAction.value.label.toLowerCase()} ${selectedCount.value} image${selectedCount.value > 1 ? "s" : ""}?`,
      confirmLabel: pendingAction.value.label,
    };
  });

  // Handle image click in selection mode
  function handleSelectionClick(instanceId: number, event: MouseEvent) {
    if (!isSelectionMode.value) {
      enterSelectionMode();
    }

    if (event.shiftKey) {
      selectRange(instanceId);
    } else {
      toggleSelection(instanceId);
    }
  }

  // Handle action button click
  function handleActionClick(action: MultiAction) {
    if (action.needsConfirmation) {
      const warnings = getAllWarnings(action, selectedImages.value);
      pendingAction.value = action;
      pendingWarnings.value = warnings;
      showConfirmModal.value = true;
    } else {
      executeAction(action);
    }
  }

  // Confirm the pending action
  function handleConfirmAction() {
    if (!pendingAction.value) return;

    showConfirmModal.value = false;
    executeAction(pendingAction.value);

    pendingAction.value = null;
    pendingWarnings.value = [];
  }

  // Cancel the pending confirmation
  function handleCancelConfirmation() {
    showConfirmModal.value = false;
    pendingAction.value = null;
    pendingWarnings.value = [];
  }

  // Execute an action with delayed operation
  function executeAction(action: MultiAction) {
    const count = selectedCount.value;
    const label = `${action.message} ${count} image${count > 1 ? "s" : ""}`;

    const proceed = scheduleOperation(
      label,
      async () => {
        isExecuting.value = true;
        try {
          await action.execute(selectedImages.value, context);

          if (onActionComplete) {
            await onActionComplete();
          }

          exitSelectionMode();
          success(
            `Successfully ${action.message.toLowerCase()} ${count} image${count > 1 ? "s" : ""}`
          );
        } catch (error: any) {
          showError(
            error.message || `Failed to ${action.label.toLowerCase()} images`
          );
        } finally {
          isExecuting.value = false;
        }
      },
      action.delay
    );

    if (!proceed) return;
  }

  // Handle filter selection
  function handleFilterSelect(filterIds: string[]) {
    selectByFilter(filterIds);
  }

  return {
    // Selection state
    selectedImageIds,
    isSelectionMode,
    hasSelection,
    selectedCount,
    selectedImages,

    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    enterSelectionMode,
    exitSelectionMode,
    selectRange,
    handleSelectionClick,
    handleFilterSelect,

    // Multi-action state
    actions,
    showConfirmModal,
    pendingAction,
    pendingWarnings,
    isExecuting,
    confirmationContent,

    // Multi-action handlers
    handleActionClick,
    handleConfirmAction,
    handleCancelConfirmation,
  };
}

export type UseImageAdminActionsReturn = ReturnType<
  typeof useImageAdminActions
>;
