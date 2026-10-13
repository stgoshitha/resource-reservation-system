
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import type {
  GenericTableColumn,
  GenericTableProps,
} from "./GenericTable.types";

type SortDirection = "asc" | "desc";

function getCellValue<T>(
  row: T,
  column: GenericTableColumn<T>
): unknown {
  if (!column.accessor) return undefined;

  return row[column.accessor];
}

function compareValues(
  first: unknown,
  second: unknown
): number {
  if (first == null && second == null) return 0;
  if (first == null) return 1;
  if (second == null) return -1;

  if (
    typeof first === "number" &&
    typeof second === "number"
  ) {
    return first - second;
  }

  if (
    typeof first === "boolean" &&
    typeof second === "boolean"
  ) {
    return Number(first) - Number(second);
  }

  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export default function GenericTable<T>({
  data,
  columns,
  getRowKey,
  loading = false,
  emptyMessage = "No records found.",
  searchable = false,
  searchPlaceholder = "Search records...",
  searchFilter,
  pagination = true,
  pageSize = 10,
  onRowClick,
  className = "",
}: GenericTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const safePageSize = Math.max(1, Math.floor(pageSize) || 10);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!searchable || !query) return data;

    return data.filter((row) => {
      if (searchFilter) {
        return searchFilter(row, query);
      }

      return columns.some((column) => {
        const value = getCellValue(row, column);

        return (
          value != null &&
          String(value).toLowerCase().includes(query)
        );
      });
    });
  }, [
    data,
    columns,
    searchQuery,
    searchable,
    searchFilter,
  ]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const column = columns.find(
      (item) => item.key === sortKey
    );

    if (!column?.sortable || !column.accessor) {
      return filteredData;
    }

    return [...filteredData].sort((first, second) => {
      const result = compareValues(
        getCellValue(first, column),
        getCellValue(second, column)
      );

      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredData, columns, sortKey, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / safePageSize)
  );

  const activePage = Math.min(currentPage, totalPages);

  const displayedData = pagination
    ? sortedData.slice(
        (activePage - 1) * safePageSize,
        activePage * safePageSize
      )
    : sortedData;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  function handleSort(column: GenericTableColumn<T>) {
    if (!column.sortable || !column.accessor) return;

    if (sortKey === column.key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  }

  function getSortIcon(column: GenericTableColumn<T>) {
    if (sortKey !== column.key) {
      return (
        <ArrowUpDown
          size={14}
          className="text-slate-400"
        />
      );
    }

    return sortDirection === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  }

  const startRecord =
    sortedData.length === 0
      ? 0
      : pagination
        ? (activePage - 1) * safePageSize + 1
        : 1;

  const endRecord = pagination
    ? Math.min(
        activePage * safePageSize,
        sortedData.length
      )
    : sortedData.length;

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border",
        "border-[#E2E8F0] bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {searchable && (
        <div className="border-b border-[#E2E8F0] p-4">
          <div className="relative max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder={searchPlaceholder}
              aria-label="Search table"
              className={[
                "h-10 w-full rounded-xl border",
                "border-[#E2E8F0] bg-white",
                "pl-10 pr-4 text-sm text-[#0F172A]",
                "outline-none transition",
                "placeholder:text-[#94A3B8]",
                "focus:border-[#4F46E5]",
                "focus:ring-2 focus:ring-indigo-100",
              ].join(" ")}
            />
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr>
              {columns.map((column) => {
                const alignment =
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                      ? "text-right"
                      : "text-left";

                const canSort =
                  column.sortable && column.accessor;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortKey === column.key
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={[
                      "whitespace-nowrap border-b",
                      "border-[#E2E8F0] px-5 py-3.5",
                      "text-xs font-semibold uppercase",
                      "tracking-wide text-[#64748B]",
                      alignment,
                      column.className ?? "",
                    ].join(" ")}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSort(column)
                        }
                        className={[
                          "inline-flex items-center gap-2",
                          "transition hover:text-[#4F46E5]",
                        ].join(" ")}
                      >
                        {column.header}
                        {getSortIcon(column)}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-100 border-t-[#4F46E5]" />
                    <span className="text-sm text-[#64748B]">
                      Loading records...
                    </span>
                  </div>
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-5 py-16 text-center text-sm text-[#64748B]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayedData.map((row, index) => {
                const rowIndex = pagination
                  ? (activePage - 1) * safePageSize + index
                  : index;

                return (
                  <tr
                    key={getRowKey(row)}
                    onClick={
                      onRowClick
                        ? () => onRowClick(row)
                        : undefined
                    }
                    className={[
                      "transition-colors hover:bg-[#F8FAFC]",
                      onRowClick
                        ? "cursor-pointer"
                        : "",
                    ].join(" ")}
                  >
                    {columns.map((column) => {
                      const value = getCellValue(
                        row,
                        column
                      );

                      const content = column.render
                        ? column.render(row, rowIndex)
                        : value == null
                          ? "—"
                          : String(value);

                      const alignment =
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : "text-left";

                      return (
                        <td
                          key={column.key}
                          className={[
                            "px-5 py-4 align-middle",
                            "text-[#334155]",
                            alignment,
                            column.className ?? "",
                          ].join(" ")}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-5 py-4">
          <p className="text-xs text-[#64748B]">
            Showing{" "}
            <span className="font-semibold text-[#334155]">
              {startRecord}–{endRecord}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#334155]">
              {sortedData.length}
            </span>{" "}
            records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() =>
                setCurrentPage(activePage - 1)
              }
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-16 text-center text-xs font-medium text-[#334155]">
              {activePage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() =>
                setCurrentPage(activePage + 1)
              }
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
