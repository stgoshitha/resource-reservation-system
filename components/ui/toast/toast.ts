
import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  description?: string;
  duration?: number;
};

export const toast = {
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, options);
  },

  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, options);
  },

  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, options);
  },

  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, options);
  },

  loading(message: string) {
    return sonnerToast.loading(message);
  },

  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) {
    return sonnerToast.promise(promise, messages);
  },
};
