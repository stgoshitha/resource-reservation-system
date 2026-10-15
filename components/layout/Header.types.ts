import type { ReactNode } from "react";

export interface HeaderNavigationItem {
  href: string;
  label: string;
}

export interface HeaderProps {
  title?: string;
  userName?: string;
  userEmail?: string;
  role?: "ADMIN" | "USER";
  onMenuClick?: () => void;
  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;
  actions?: ReactNode;
  navigation?: HeaderNavigationItem[];
  className?: string;
}
