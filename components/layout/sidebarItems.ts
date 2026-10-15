import {
  LayoutDashboard,
  Boxes,
  FolderTree,
  CalendarDays,
  Users,
  Search,
  CalendarCheck,
} from "lucide-react";

import type {
  SidebarItem,
  SidebarRole,
} from "./Sidebar.types";

export const adminSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Resources",
    href: "/admin/resources",
    icon: Boxes,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Reservations",
    href: "/admin/reservations",
    icon: CalendarDays,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export const userSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Browse Resources",
    href: "/dashboard/resources",
    icon: Search,
  },
  {
    label: "My Reservations",
    href: "/dashboard/reservations",
    icon: CalendarCheck,
  },
];

export function getSidebarItems(
  role: SidebarRole
): SidebarItem[] {
  return role === "ADMIN"
    ? adminSidebarItems
    : userSidebarItems;
}
