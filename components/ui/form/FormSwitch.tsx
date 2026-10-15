"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export interface FormSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

const FormSwitch = forwardRef<HTMLInputElement, FormSwitchProps>(
  function FormSwitch(
    {
      label,
      description,
      className = "",
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <label
        className={`flex items-center justify-between gap-4 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <span>
          <span className="block text-sm font-medium text-[#334155]">
            {label}
          </span>

          {description && (
            <span className="mt-1 block text-xs text-[#64748B]">
              {description}
            </span>
          )}
        </span>

        <span className="relative inline-flex shrink-0">
          <input
            {...props}
            ref={ref}
            type="checkbox"
            role="switch"
            disabled={disabled}
            className={`peer sr-only ${className}`}
          />

          <span className="h-6 w-11 rounded-full bg-[#CBD5E1] transition-colors peer-checked:bg-[#4F46E5] peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-200" />

          <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
    );
  }
);

export default FormSwitch;
