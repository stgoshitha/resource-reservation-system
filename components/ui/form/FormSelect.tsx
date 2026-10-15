"use client";

import * as Select from "@radix-ui/react-select";
import {
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Children,
  isValidElement,
  forwardRef,
  type ChangeEvent,
  type ReactElement,
  type SelectHTMLAttributes,
} from "react";

export interface FormSelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange"
  > {
  error?: boolean;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

type OptionProps = {
  value?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      error = false,
      className = "",
      children,
      placeholder,
      ...props
    },
    ref
  ) {
    const options = Children.toArray(children)
      .filter(
        (child): child is ReactElement<OptionProps> =>
          isValidElement<OptionProps>(child) &&
          child.type === "option"
      )
      .map((child) => ({
        value: child.props.value ?? "",
        label: child.props.children,
        disabled: child.props.disabled ?? false,
      }));

    const emptyOption = options.find(
      (option) => option.value === ""
    );

    const validOptions = options.filter(
      (option) => option.value !== ""
    );

    const currentValue =
      value === undefined ? undefined : String(value);

    const initialValue =
      defaultValue === undefined
        ? undefined
        : String(defaultValue);

    function handleValueChange(nextValue: string) {
      if (!onChange) return;

      const event = {
        target: {
          value: nextValue,
          name: name ?? "",
          id: id ?? "",
        },
        currentTarget: {
          value: nextValue,
          name: name ?? "",
          id: id ?? "",
        },
      } as ChangeEvent<HTMLSelectElement>;

      onChange(event);
    }

    return (
      <Select.Root
        name={name}
        value={currentValue}
        defaultValue={initialValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
      >
        <Select.Trigger
          id={id}
          aria-invalid={error || undefined}
          className={[
            "flex h-11 w-full items-center justify-between",
            "rounded-xl border bg-white px-4",
            "text-left text-sm text-[#0F172A]",
            "outline-none transition-all",
            "data-[placeholder]:text-[#94A3B8]",
            "focus:ring-2",
            "disabled:cursor-not-allowed",
            "disabled:bg-[#F8FAFC] disabled:opacity-60",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-indigo-100",
            className,
          ].join(" ")}
        >
          <Select.Value
            placeholder={
              placeholder ??
              emptyOption?.label ??
              "Select an option"
            }
          />

          <Select.Icon>
            <ChevronDown
              size={17}
              className="text-[#64748B]"
            />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            collisionPadding={8}
            className={[
              "z-50 overflow-hidden rounded-xl",
              "border border-[#E2E8F0] bg-white",
              "shadow-xl shadow-slate-900/10",
            ].join(" ")}
            style={{
              width: "var(--radix-select-trigger-width)",
              maxHeight:
                "var(--radix-select-content-available-height)",
            }}
          >
            <Select.ScrollUpButton className="flex h-7 items-center justify-center text-[#64748B]">
              <ChevronUp size={16} />
            </Select.ScrollUpButton>

            <Select.Viewport className="p-1.5">
              {validOptions.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={[
                    "relative flex cursor-pointer select-none",
                    "items-center rounded-lg py-3 pl-3 pr-9",
                    "text-sm text-[#334155] outline-none",
                    "transition-colors",
                    "focus:bg-[#EEF2FF] focus:text-[#4338CA]",
                    "data-[state=checked]:bg-[#EEF2FF]",
                    "data-[state=checked]:text-[#4338CA]",
                    "data-[disabled]:pointer-events-none",
                    "data-[disabled]:opacity-40",
                  ].join(" ")}
                >
                  <Select.ItemText>
                    {option.label}
                  </Select.ItemText>

                  <Select.ItemIndicator className="absolute right-3">
                    <Check
                      size={16}
                      className="text-[#4F46E5]"
                    />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>

            <Select.ScrollDownButton className="flex h-7 items-center justify-center text-[#64748B]">
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>

        {/* Keeps the forwarded ref available for form integrations. */}
        <select
          ref={ref}
          aria-hidden="true"
          tabIndex={-1}
          disabled
          value={currentValue ?? initialValue ?? ""}
          onChange={() => {}}
          className="hidden"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Select.Root>
    );
  }
);

export default FormSelect;
