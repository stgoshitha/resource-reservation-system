
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CircleHelp,
  Trash2,
} from "lucide-react";

import { Modal } from "@/components/ui/modal";

import type {
  ConfirmDialogProps,
  ConfirmDialogVariant,
} from "./ConfirmDialog.types";

const variantStyles: Record<
  ConfirmDialogVariant,
  {
    icon: string;
    button: string;
  }
> = {
  danger: {
    icon: "bg-red-50 text-red-600",
    button:
      "bg-red-600 text-white hover:bg-red-700",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600",
    button:
      "bg-amber-600 text-white hover:bg-amber-700",
  },
  primary: {
    icon: "bg-indigo-50 text-indigo-600",
    button:
      "bg-indigo-600 text-white hover:bg-indigo-700",
  },
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const busy = loading || submitting;

  async function handleConfirm() {
    if (busy) return;

    setSubmitting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirmation failed:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const Icon =
    variant === "danger"
      ? Trash2
      : variant === "warning"
        ? AlertTriangle
        : CircleHelp;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) onOpenChange(nextOpen);
      }}
      title={title}
      size="sm"
      position="center"
      showCloseButton={!busy}
      closeOnOverlayClick={!busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className={[
              "inline-flex items-center justify-center",
              "min-w-24 gap-2 rounded-lg",
              "px-4 py-2.5 text-sm font-medium",
              "transition disabled:cursor-not-allowed",
              "disabled:opacity-50",
              variantStyles[variant].button,
            ].join(" ")}
          >
            {busy && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {busy ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center",
            "rounded-2xl",
            variantStyles[variant].icon,
          ].join(" ")}
        >
          <Icon size={26} aria-hidden="true" />
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </Modal>
  );
}
