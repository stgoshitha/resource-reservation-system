import type { ReactNode } from "react";

export type StatCardVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type StatCardTrend = "up" | "down" | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: StatCardTrend;
  trendValue?: string;
  variant?: StatCardVariant;
  loading?: boolean;
  className?: string;
}
