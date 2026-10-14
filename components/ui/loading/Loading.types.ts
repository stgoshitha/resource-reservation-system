
import type { HTMLAttributes } from "react";

export type LoadingSpinnerSize = "sm" | "md" | "lg";

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  label?: string;
  className?: string;
}

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement> {
  variant?: "rectangle" | "rounded" | "circle";
  width?: string | number;
  height?: string | number;
}
