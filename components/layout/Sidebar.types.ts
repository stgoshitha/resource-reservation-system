
import type { LucideIcon } from "lucide-react";

export type SidebarRole = "ADMIN" | "USER";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface SidebarProps {
  role: SidebarRole;
  userName?: string;
  userEmail?: string;

  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;

  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;

  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;

  className?: string;
}
