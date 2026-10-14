
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import type { PageHeaderProps } from "./PageHeader.types";

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  backHref,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-2"
                >
                  {index > 0 && (
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className="text-slate-400"
                    />
                  )}

                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="text-slate-500 transition hover:text-indigo-600"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={
                        isLast
                          ? "font-medium text-slate-900"
                          : "text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </Link>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
