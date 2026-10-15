import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface FormCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

const FormCheckbox = forwardRef<
  HTMLInputElement,
  FormCheckboxProps
>(function FormCheckbox(
  { label, description, className = "", id, ...props },
  ref
) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        {...props}
        ref={ref}
        id={id}
        type="checkbox"
        className={[
          "mt-0.5 h-4 w-4 shrink-0 rounded",
          "border-[#CBD5E1] accent-[#4F46E5]",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-2",
          "focus-visible:outline-[#4F46E5]",
          "disabled:cursor-not-allowed",
          className,
        ].join(" ")}
      />

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
    </label>
  );
});

export default FormCheckbox;
