
"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      visibleToasts={4}
      gap={12}
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}
