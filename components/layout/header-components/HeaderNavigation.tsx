"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus2 } from "lucide-react";
import type { HeaderProps } from "../Header.types";

type NavigationItem = NonNullable<HeaderProps["navigation"]>[number];

interface HeaderNavigationProps {
  navigation?: HeaderProps["navigation"];
  mobile?: boolean;
}

function getNavigationIcon(item: NavigationItem) {
  if (item.href.includes("/reservations/new")) {
    return CalendarPlus2;
  }

  return CalendarDays;
}

function isActivePath(
  pathname: string,
  href: string,
  navigation: NonNullable<HeaderProps["navigation"]>
) {
  if (pathname === href) return true;

  const hasMoreSpecificMatch = navigation.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  return !hasMoreSpecificMatch && pathname.startsWith(`${href}/`);
}

export default function HeaderNavigation({
  navigation,
  mobile = false,
}: HeaderNavigationProps) {
  const pathname = usePathname();

  if (!navigation?.length) return null;

  if (mobile) {
    return (
      <nav
        aria-label="Mobile navigation"
        className="flex items-center justify-center gap-6 overflow-x-auto px-4 sm:px-6 md:hidden"
      >
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href, navigation);
          const Icon = getNavigationIcon(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative inline-flex shrink-0 items-center justify-center gap-2",
                "px-1 py-3.5 text-xs font-medium",
                "transition-colors duration-300 ease-out",
                "active:scale-[0.97] motion-reduce:active:scale-100",
                "focus-visible:rounded-sm focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-indigo-500",
                active
                  ? "font-semibold text-indigo-700"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.8}
                className={[
                  "shrink-0 transition-transform duration-300 ease-out",
                  "group-hover:-translate-y-0.5",
                  "motion-reduce:transform-none",
                  active ? "text-indigo-600" : "",
                ].join(" ")}
              />
              <span className="whitespace-nowrap">{item.label}</span>
              <span
                aria-hidden="true"
                className={[
                  "pointer-events-none absolute bottom-0 left-0 h-0.5 w-full",
                  "origin-left rounded-full bg-indigo-600",
                  "transition-transform duration-300 ease-out",
                  "motion-reduce:transition-none",
                  active
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main navigation"
      className="hidden h-full items-center gap-8 md:flex"
    >
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href, navigation);
        const Icon = getNavigationIcon(item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative inline-flex min-h-[76px] items-center gap-2",
              "px-1 text-sm font-medium",
              "transition-colors duration-300 ease-out",
              "focus-visible:rounded-sm focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-indigo-500",
              active
                ? "font-semibold text-indigo-700"
                : "text-slate-500 hover:text-slate-900",
            ].join(" ")}
          >
            <Icon
              size={18}
              strokeWidth={active ? 2.2 : 1.8}
              className={[
                "shrink-0 transition-all duration-300 ease-out",
                "group-hover:-translate-y-0.5",
                "motion-reduce:transform-none",
                active
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-indigo-500",
              ].join(" ")}
            />
            <span className="whitespace-nowrap">{item.label}</span>
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute bottom-0 left-0 h-0.5 w-full",
                "origin-left rounded-full bg-indigo-600",
                "transition-transform duration-300 ease-out",
                "motion-reduce:transition-none",
                active
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
