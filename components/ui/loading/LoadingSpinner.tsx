
import type { LoadingSpinnerProps } from "./Loading.types";

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-10 w-10 border-4",
};

export default function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-flex items-center justify-center",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block animate-spin rounded-full",
          "border-indigo-100 border-t-indigo-600",
          sizeStyles[size],
        ].join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
