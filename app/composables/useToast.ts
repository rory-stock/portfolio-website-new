export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  duration?: number; // For countdown bar
  action?: ToastAction; // For cancel button
  countdownStarted?: boolean; // Internal flag for animation
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export const useToast = () => {
  const show = (
    message: string,
    type: Toast["type"] = "info",
    duration = 3000,
    options?: { action?: ToastAction }
  ) => {
    const id = toastId++;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action: options?.action,
      countdownStarted: false,
    };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  };

  const remove = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (message: string, duration = 3000) =>
    show(message, "success", duration);
  const error = (message: string, duration = 5000) =>
    show(message, "error", duration);
  const info = (
    message: string,
    duration = 3000,
    options?: { action?: ToastAction }
  ) => show(message, "info", duration, options);

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    info,
  };
};
