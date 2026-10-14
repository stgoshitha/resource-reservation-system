
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
        "rounded-2xl border border-slate-200",
        "bg-white p-5 shadow-sm",
        "transition-shadow hover:shadow-md",
        className,
      ].join(" ")}
      aria-busy={loading}
    >
      {loading ? (
        <div
          className="animate-pulse space-y-5"
          role="status"
          aria-label={`Loading ${title}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-11 w-11 rounded-xl bg-slate-100" />
          </div>

          <div className="h-9 w-24 rounded bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-100" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-sm font-medium text-slate-500">
              {title}
            </h3>

            {icon && (
              <div
                className={[
                  "flex h-11 w-11 shrink-0",
                  "items-center justify-center",
                  "rounded-xl",
                  variantStyles[variant].icon,
                ].join(" ")}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
          </div>

          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>

            {(trendValue || description) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                {trendValue && (
                  <span
                    className={[
                      "inline-flex items-center gap-1",
                      "text-xs font-semibold",
                      trendStyles[trend],
                    ].join(" ")}
                  >
                    <TrendIcon size={15} aria-hidden="true" />
                    {trendValue}
                  </span>
                )}

                {description && (
                  <span className="text-xs text-slate-500">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
