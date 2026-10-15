import type { ReactNode } from "react";

export type TabsOrientation = "horizontal" | "vertical";

export type TabsHeight = "content" | "full";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  orientation?: TabsOrientation;
  height?: TabsHeight;

  className?: string;
  listClassName?: string;
  contentClassName?: string;
}
