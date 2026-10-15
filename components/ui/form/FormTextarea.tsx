import {
  forwardRef,
  type TextareaHTMLAttributes,
} from "react";

export interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    { error = false, className = "", ...props },
    ref
  ) {
    return (
      <textarea
        ref={ref}
        {...props}
        aria-invalid={error || undefined}
        className={[
          "min-h-28 w-full resize-y rounded-xl border bg-white px-4 py-3",
          "text-sm text-[#0F172A] outline-none",
          "placeholder:text-[#94A3B8]",
          "transition-colors",
          "disabled:cursor-not-allowed disabled:bg-[#F8FAFC]",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100",
          className,
        ].join(" ")}
      />
    );
  }
);

export default FormTextarea;
