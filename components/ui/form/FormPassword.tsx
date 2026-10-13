
"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import FormInput, { type FormInputProps } from "./FormInput";

export type FormPasswordProps = Omit<FormInputProps, "type">;

const FormPassword = forwardRef<HTMLInputElement, FormPasswordProps>(
  function FormPassword({ className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <LockKeyhole
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />

        <FormInput
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={`pl-11 pr-12 ${className}`}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={props.disabled}
          className="absolute right-3 top-1/2 rounded-lg p-1 -translate-y-1/2 text-[#64748B] hover:text-[#4F46E5] disabled:opacity-50"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);

export default FormPassword;
