export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export const useToast = () => {
  const show = (
    message: string,
    type: Toast["type"] = "info",
    duration = 3000
  ) => {
    const id = toastId++;
    toasts.value.push({ id, message, type });

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
  const info = (message: string, duration = 3000) =>
    show(message, "info", duration);

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    info,
  };
};
