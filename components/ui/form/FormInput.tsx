
import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export interface FormInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { error = false, className = "", ...props },
    ref
  ) {
    return (
      <input
        ref={ref}
        {...props}
        aria-invalid={error || undefined}
        className={[
          "h-11 w-full rounded-xl border bg-white px-4",
          "text-sm text-[#0F172A] outline-none",
          "placeholder:text-[#94A3B8]",
          "transition-colors",
          "disabled:cursor-not-allowed disabled:bg-[#F8FAFC]",
          "disabled:text-[#94A3B8]",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100",
          className,
        ].join(" ")}
      />
    );
  }
);

export default FormInput;
