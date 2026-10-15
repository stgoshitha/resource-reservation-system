"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] focus-visible:ring-indigo-200",

  secondary:
    "bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF] focus-visible:ring-indigo-200",

  outline:
    "border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC] focus-visible:ring-indigo-200",

  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
        className={[
          "inline-flex items-center justify-center gap-2",
          "rounded-xl font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-4",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}

        {children}
      </button>
    );
  }
);

export default Button;
