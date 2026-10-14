
"use client";

import * as RadixTabs from "@radix-ui/react-tabs";

import type { TabsProps } from "./Tabs.types";

export default function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  height = "content",
  className = "",
  listClassName = "",
  contentClassName = "",
}: TabsProps) {
  const isVertical = orientation === "vertical";
  const isFullHeight = height === "full";

  const initialValue =
    defaultValue ?? tabs.find((tab) => !tab.disabled)?.id;

  return (
    <RadixTabs.Root
      value={value}
      defaultValue={initialValue}
      onValueChange={onValueChange}
      orientation={orientation}
      className={[
        "min-w-0",
        isVertical
          ? "flex flex-col gap-4 md:flex-row"
          : "flex flex-col",
        isFullHeight && "h-full min-h-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <RadixTabs.List
        aria-label="Sections"
        className={[
          "flex shrink-0",
          isVertical
            ? "flex-row gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 md:w-56 md:flex-col md:overflow-visible"
            : "gap-1 overflow-x-auto border-b border-slate-200",
          listClassName,
        ].join(" ")}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={[
              "inline-flex shrink-0 items-center gap-2",
              "px-4 py-3 text-sm font-medium",
              "outline-none transition-colors",
              "disabled:cursor-not-allowed",
              "disabled:opacity-40",
              "focus-visible:ring-2",
              "focus-visible:ring-indigo-500",
              "data-[state=active]:text-indigo-600",
              "data-[state=inactive]:text-slate-500",
              isVertical
                ? "rounded-lg text-left hover:bg-indigo-50 md:w-full data-[state=active]:bg-indigo-50"
                : "border-b-2 border-transparent whitespace-nowrap hover:text-slate-800 data-[state=active]:border-indigo-600",
            ].join(" ")}
          >
            {tab.icon && (
              <span aria-hidden="true" className="shrink-0">
                {tab.icon}
              </span>
            )}

            <span>{tab.label}</span>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      <div
        className={[
          "min-w-0 flex-1",
          isVertical ? "" : "pt-5",
          isFullHeight && "min-h-0",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {tabs.map((tab) => (
          <RadixTabs.Content
            key={tab.id}
            value={tab.id}
            className={[
              "min-w-0 outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-indigo-500",
              isFullHeight && "h-full min-h-0",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tab.content}
          </RadixTabs.Content>
        ))}
      </div>
    </RadixTabs.Root>
  );
}
