
import type {
  StatusBadgeProps,
  StatusBadgeVariant,
} from "./StatusBadge.types";

const variantStyles: Record<StatusBadgeVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-200",
  danger:
    "bg-red-50 text-red-700 ring-red-200",
  info:
    "bg-indigo-50 text-indigo-700 ring-indigo-200",
  neutral:
    "bg-slate-100 text-slate-600 ring-slate-200",
};

const dotStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-indigo-500",
  neutral: "bg-slate-400",
};

function getStatusVariant(status: string): StatusBadgeVariant {
  const normalized = status.trim().toUpperCase();

  const statusMap: Record<string, StatusBadgeVariant> = {
    ACTIVE: "success",
    AVAILABLE: "success",
    CONFIRMED: "success",
    APPROVED: "success",
    COMPLETED: "success",
    SUCCESS: "success",

    PENDING: "warning",
    MAINTENANCE: "warning",
    IN_PROGRESS: "warning",
    PROCESSING: "warning",

    INACTIVE: "danger",
    CANCELLED: "danger",
    CANCELED: "danger",
    REJECTED: "danger",
    FAILED: "danger",
    UNAVAILABLE: "danger",

    OPEN: "info",
    UPCOMING: "info",
    RESERVED: "info",
    INFO: "info",

    DRAFT: "neutral",
    UNKNOWN: "neutral",
    ARCHIVED: "neutral",
  };

  return statusMap[normalized] ?? "neutral";
}

function formatStatus(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusBadge({
  status,
  variant,
  size = "md",
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const selectedVariant = variant ?? getStatusVariant(status);

  const sizeStyles =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-xs";

  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5",
        "rounded-full font-medium",
        "ring-1 ring-inset",
        "whitespace-nowrap",
        variantStyles[selectedVariant],
        sizeStyles,
        className,
      ].join(" ")}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={[
            "h-1.5 w-1.5 shrink-0 rounded-full",
            dotStyles[selectedVariant],
          ].join(" ")}
        />
      )}

      {formatStatus(status)}
    </span>
  );
}
