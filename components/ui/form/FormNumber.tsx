
import { forwardRef } from "react";
import FormInput, { type FormInputProps } from "./FormInput";

export type FormNumberProps = Omit<FormInputProps, "type">;

const FormNumber = forwardRef<HTMLInputElement, FormNumberProps>(
  function FormNumber({ min = 0, step = 1, ...props }, ref) {
    return (
      <FormInput
        {...props}
        ref={ref}
        type="number"
        min={min}
        step={step}
        inputMode="numeric"
      />
    );
  }
);

export default FormNumber;
