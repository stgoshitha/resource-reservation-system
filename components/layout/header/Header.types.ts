
import type { ReactNode } from "react";

export interface HeaderProps {
  title?: string;
  userName?: string;
  userEmail?: string;
  role?: "ADMIN" | "USER";
  onMenuClick?: () => void;
  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;
  actions?: ReactNode;
  className?: string;
}
