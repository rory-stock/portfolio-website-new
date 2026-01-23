import { computed, ref } from "vue";
import { onKeyStroke } from "@vueuse/core";

export interface DelayedOperationOptions {
  defaultDelay?: number;
}

export function useDelayedOperation(options: DelayedOperationOptions = {}) {
  const { defaultDelay = 8000 } = options;

  const pendingOperation = ref<{
    id: string;
    label: string;
    timeout: NodeJS.Timeout;
    toastId: number;
    cancel: () => void;
  } | null>(null);

  const { info, success, error: showError, remove: removeToast } = useToast();

  /**
   * Schedule an operation to execute after a delay
   * Returns false if the user cancels due to an existing operation
   */
  function scheduleOperation(
    label: string,
    execute: () => Promise<void>,
    customDelay?: number
  ): boolean {
    // Check if there's already a pending operation
    if (pendingOperation.value) {
      const existingLabel = pendingOperation.value.label;

      const proceed = confirm(
        `Operation in progress: "${existingLabel}"\n\n` +
          `Starting a new operation will cancel the current one.\n\n` +
          `Do you want to proceed?`
      );

      if (!proceed) {
        return false;
      }

      // Cancel existing operation
      clearTimeout(pendingOperation.value.timeout);
      pendingOperation.value = null;
      showError("Previous operation cancelled");
    }

    const delay = customDelay ?? defaultDelay;
    const id = `delayed-${Date.now()}`;
    let isCancelled = false;

    // Cancel function
    const cancel = () => {
      if (!isCancelled && pendingOperation.value?.id === id) {
        isCancelled = true;
        clearTimeout(pendingOperation.value.timeout);

        // Remove the original toast after a short delay (500ms)
        const originalToastId = pendingOperation.value.toastId;
        setTimeout(() => {
          removeToast(originalToastId);
        }, 800);

        pendingOperation.value = null;
        success("Operation cancelled");
      }
    };

    // Set timeout to execute after a delay
    const timeout = setTimeout(async () => {
      if (!isCancelled) {
        pendingOperation.value = null;
        await execute();
      }
    }, delay);

    // Store pending operation
    pendingOperation.value = { id, label, timeout, toastId: 0, cancel };

    // Update the stored toastId
    pendingOperation.value.toastId = info(label, delay, {
      action: {
        label: "Cancel",
        handler: cancel,
      },
    });

    return true;
  }

  /**
   * Cancel the pending operation (if any)
   */
  function cancelPending() {
    if (pendingOperation.value) {
      pendingOperation.value.cancel();
    }
  }

  // Keyboard shortcut: Ctrl/Cmd+Z to cancel
  onKeyStroke("z", (e) => {
    if ((e.ctrlKey || e.metaKey) && pendingOperation.value) {
      e.preventDefault();
      cancelPending();
    }
  });

  return {
    scheduleOperation,
    cancelPending,
    hasPending: computed(() => pendingOperation.value !== null),
  };
}
