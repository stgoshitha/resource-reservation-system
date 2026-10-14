
import type { SkeletonProps } from "./Loading.types";

const variantStyles = {
  rectangle: "rounded-none",
  rounded: "rounded-lg",
  circle: "rounded-full",
};

export default function Skeleton({
  variant = "rounded",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      style={{
        ...style,
        width,
        height,
      }}
      className={[
        "animate-pulse bg-slate-200",
        variantStyles[variant],
        className,
      ].join(" ")}
    />
  );
}
