
import { forwardRef } from "react";
import { Search } from "lucide-react";
import FormInput, { type FormInputProps } from "./FormInput";

export type FormSearchProps = Omit<FormInputProps, "type">;

const FormSearch = forwardRef<HTMLInputElement, FormSearchProps>(
  function FormSearch(
    {
      placeholder = "Search...",
      className = "",
      ...props
    },
    ref
  ) {
    return (
      <div className="relative">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />

        <FormInput
          {...props}
          ref={ref}
          type="search"
          placeholder={placeholder}
          className={`pl-11 ${className}`}
        />
      </div>
    );
  }
);

export default FormSearch;
