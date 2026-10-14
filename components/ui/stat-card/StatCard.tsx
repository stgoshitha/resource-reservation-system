
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import type {
  StatCardProps,
  StatCardTrend,
  StatCardVariant,
} from "./StatCard.types";

const variantStyles: Record<
  StatCardVariant,
  { icon: string }
> = {
  primary: {
    icon: "bg-indigo-50 text-indigo-600",
  },
  success: {
    icon: "bg-emerald-50 text-emerald-600",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600",
  },
  danger: {
    icon: "bg-red-50 text-red-600",
  },
  neutral: {
    icon: "bg-slate-100 text-slate-600",
  },
};

const trendStyles: Record<StatCardTrend, string> = {
  up: "text-emerald-600",
  down: "text-red-600",
  neutral: "text-slate-500",
};

const trendIcons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: ArrowRight,
};

export default function StatCard({
  title,
  value,
  icon,
  description,
  trend = "neutral",
  trendValue,
  variant = "primary",
  loading = false,
  className = "",
}: StatCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <div
      className={[
        "group rounded-2xl border border-slate-200/90",
        "bg-white p-5 sm:p-6",
        "shadow-sm transition-all duration-200",
        "hover:border-slate-300 hover:shadow-md",
        className,
      ].join(" ")}
      aria-busy={loading}
    >
      {loading ? (
        <div
          className="animate-pulse"
          role="status"
          aria-label={`Loading ${title}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="h-6 w-24 rounded-lg bg-slate-100" />
          </div>

          <div className="mt-5 h-9 w-20 rounded-lg bg-slate-200" />

          <div className="mt-3 h-4 w-32 rounded bg-slate-100" />

          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            {icon ? (
              <div
                className={[
                  "flex h-10 w-10 shrink-0",
                  "items-center justify-center",
                  "rounded-xl transition-transform duration-200",
                  "group-hover:scale-105",
                  variantStyles[variant].icon,
                ].join(" ")}
                aria-hidden="true"
              >
                {icon}
              </div>
            ) : (
              <div />
            )}

            {trendValue && (
              <span
                className={[
                  "inline-flex max-w-full items-center gap-1",
                  "rounded-md bg-slate-50 px-2 py-1",
                  "text-xs font-semibold",
                  trendStyles[trend],
                ].join(" ")}
              >
                <TrendIcon
                  size={14}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {trendValue}
              </span>
            )}
          </div>

          <div className="mt-5">
            <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[32px]">
              {value}
            </p>

            <h3 className="mt-1 text-sm font-medium text-slate-500">
              {title}
            </h3>

            {description && (
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
