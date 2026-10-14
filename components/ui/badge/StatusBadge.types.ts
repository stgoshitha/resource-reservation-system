
export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type StatusBadgeSize = "sm" | "md";

export interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  showDot?: boolean;
  className?: string;
}
