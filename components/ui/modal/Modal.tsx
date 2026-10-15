"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type {
  ModalProps,
  ModalPosition,
  ModalSize,
} from "./Modal.types";

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const positionStyles: Record<ModalPosition, string> = {
  center: [
    "left-1/2 top-1/2",
    "-translate-x-1/2 -translate-y-1/2",
    "max-h-[calc(100dvh-2rem)]",
    "rounded-2xl",
    "data-[state=open]:animate-[modal-center-in_250ms_ease-out]",
    "data-[state=closed]:animate-[modal-center-out_200ms_ease-in]",
  ].join(" "),

  right: [
    "right-0 top-0",
    "h-dvh max-h-dvh",
    "rounded-none sm:rounded-l-2xl",
    "data-[state=open]:animate-[modal-right-in_300ms_ease-out]",
    "data-[state=closed]:animate-[modal-right-out_250ms_ease-in]",
  ].join(" "),

  left: [
    "left-0 top-0",
    "h-dvh max-h-dvh",
    "rounded-none sm:rounded-r-2xl",
    "data-[state=open]:animate-[modal-left-in_300ms_ease-out]",
    "data-[state=closed]:animate-[modal-left-out_250ms_ease-in]",
  ].join(" "),
};

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  position = "center",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
}: ModalProps) {
  const isDrawer = position !== "center";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            "fixed inset-0 z-50",
            "bg-slate-950/50",
            "backdrop-blur-[2px]",
            "data-[state=open]:animate-[modal-overlay-in_250ms_ease-out]",
            "data-[state=closed]:animate-[modal-overlay-out_200ms_ease-in]",
          ].join(" ")}
        />

        <Dialog.Content
          onPointerDownOutside={(event) => {
            if (!closeOnOverlayClick) {
              event.preventDefault();
            }
          }}
          className={[
            "fixed z-50",
            "flex flex-col overflow-hidden",
            "w-[calc(100%-2rem)]",
            "border border-slate-200",
            "bg-white shadow-2xl",
            "outline-none",
            "motion-reduce:!animate-none",
            sizeStyles[size],
            positionStyles[position],
            isDrawer && "w-full sm:w-[90vw]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* Header */}
          <div
            className={[
              "flex shrink-0 items-start",
              "justify-between gap-4",
              "border-b border-slate-200",
              "px-5 py-5 sm:px-6",
            ].join(" ")}
          >
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {title}
              </Dialog.Title>

              {description ? (
                <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  {title}
                </Dialog.Description>
              )}
            </div>

            {showCloseButton && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className={[
                    "flex h-9 w-9 shrink-0",
                    "items-center justify-center",
                    "rounded-lg text-slate-500",
                    "transition-colors",
                    "hover:bg-slate-100",
                    "hover:text-slate-900",
                    "focus-visible:outline-2",
                    "focus-visible:outline-offset-2",
                    "focus-visible:outline-indigo-600",
                  ].join(" ")}
                >
                  <X size={19} />
                </button>
              </Dialog.Close>
            )}
          </div>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={[
                "flex shrink-0 flex-wrap",
                "items-center justify-end gap-3",
                "border-t border-slate-200",
                "bg-slate-50 px-5 py-4 sm:px-6",
              ].join(" ")}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
