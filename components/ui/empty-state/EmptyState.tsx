
import { Inbox } from "lucide-react";

import type { EmptyStateProps } from "./EmptyState.types";

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center",
        "rounded-2xl border border-dashed border-slate-200",
        "bg-white px-6 py-14 text-center",
        className,
      ].join(" ")}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon ?? <Inbox size={30} strokeWidth={1.7} />}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
