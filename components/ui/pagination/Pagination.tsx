
"use client";

import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { PaginationProps } from "./Pagination.types";

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  if (totalPages <= 0) return [];

  const visible = new Set<number>([1, totalPages]);

  const start = Math.max(1, currentPage - siblingCount);
  const end = Math.min(totalPages, currentPage + siblingCount);

  for (let page = start; page <= end; page++) {
    visible.add(page);
  }

  const sorted = Array.from(visible).sort((a, b) => a - b);
  const result: PageItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    const previous = sorted[i - 1];

    if (previous !== undefined) {
      const gap = page - previous;

      if (gap === 2) {
        result.push(previous + 1);
      } else if (gap > 2) {
        result.push(
          previous === 1 ? "ellipsis-left" : "ellipsis-right"
        );
      }
    }

    result.push(page);
  }

  return result;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  siblingCount = 1,
  showPageSize = true,
  showInfo = true,
  disabled = false,
  className = "",
}: PaginationProps) {
  const safeTotalItems = Math.max(0, totalItems);
  const safePageSize = Math.max(1, pageSize);

  const totalPages = Math.max(
    1,
    Math.ceil(safeTotalItems / safePageSize)
  );

  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    totalPages
  );

  const pages = useMemo(
    () =>
      getPageNumbers(
        safeCurrentPage,
        totalPages,
        Math.max(0, siblingCount)
      ),
    [safeCurrentPage, totalPages, siblingCount]
  );

  const startItem =
    safeTotalItems === 0
      ? 0
      : (safeCurrentPage - 1) * safePageSize + 1;

  const endItem = Math.min(
    safeCurrentPage * safePageSize,
    safeTotalItems
  );

  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < totalPages;

  const buttonBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";

  function goToPage(page: number) {
    if (disabled) return;

    const nextPage = Math.min(
      Math.max(1, page),
      totalPages
    );

    if (nextPage !== safeCurrentPage) {
      onPageChange(nextPage);
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className={[
        "flex flex-col gap-4",
        "border-t border-slate-200 pt-4",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-4">
        {showInfo && (
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {startItem}–{endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {safeTotalItems}
            </span>
          </p>
        )}

        {showPageSize && onPageSizeChange && (
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span>Rows per page</span>

            <select
              value={safePageSize}
              disabled={disabled}
              onChange={(event) =>
                onPageSizeChange(Number(event.target.value))
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {Array.from(
                new Set([...pageSizeOptions, safePageSize])
              )
                .filter((size) => size > 0)
                .sort((a, b) => a - b)
                .map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 self-start sm:self-auto">
        <button
          type="button"
          aria-label="Previous page"
          disabled={disabled || !canGoPrevious}
          onClick={() => goToPage(safeCurrentPage - 1)}
          className={[
            buttonBase,
            "border-slate-200 bg-white text-slate-600",
            "hover:bg-slate-50",
          ].join(" ")}
        >
          <ChevronLeft size={17} />
        </button>

        {pages.map((page) => {
          if (typeof page !== "number") {
            return (
              <span
                key={page}
                aria-hidden="true"
                className="flex h-9 min-w-7 items-center justify-center text-sm text-slate-400"
              >
                ...
              </span>
            );
          }

          const isActive = page === safeCurrentPage;

          return (
            <button
              key={page}
              type="button"
              disabled={disabled}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => goToPage(page)}
              className={[
                buttonBase,
                isActive
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          disabled={disabled || !canGoNext}
          onClick={() => goToPage(safeCurrentPage + 1)}
          className={[
            buttonBase,
            "border-slate-200 bg-white text-slate-600",
            "hover:bg-slate-50",
          ].join(" ")}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}
