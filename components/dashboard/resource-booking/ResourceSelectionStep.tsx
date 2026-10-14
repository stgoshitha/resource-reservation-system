
"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Presentation,
  Users,
  Layers3,
} from "lucide-react";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import { FormField, FormInput } from "@/components/ui/form";
import Button from "@/components/ui/button/Button";
import type { BookingModel } from "./useResourceBooking";

const PAGE_SIZE = 6;
type Resource = BookingModel["visibleResources"][number];

export default function ResourceSelectionStep({
  booking,
}: {
  booking: BookingModel;
}) {
  const {
    filteredResources,
    loading,
    search,
    setSearch,
    setPage,
    categoryId,
    setCategoryId,
    categories,
    resources,
    visibleResources,
    resourceId,
    selectResource,
    saving,
    totalPages,
    currentPage,
  } = booking;

  const columns: GenericTableColumn<Resource>[] = [
    {
      key: "resource",
      header: "Resource",
      render: (resource) => {
        const isSelected = resourceId === resource.resourceId;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers3 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="truncate font-semibold text-slate-900"
                  title={resource.resourceName}
                >
                  {resource.resourceName}
                </span>
                {isSelected && (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-indigo-600"
                    aria-label="Selected"
                  />
                )}
              </div>
              <p
                className="mt-0.5 truncate text-xs text-slate-500"
                title={`${resource.category.categoryName} · ${resource.resourceCode}`}
              >
                {resource.category.categoryName} · {resource.resourceCode}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "location",
      header: "Location",
      accessor: "location",
      render: (resource) => (
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {resource.location || "Not specified"}
          </span>
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      accessor: "capacity",
      render: (resource) =>
        resource.capacity != null
          ? `${resource.capacity} seats`
          : "—",
    },
    {
      key: "interval",
      header: "Interval",
      render: (resource) =>
        `${resource.category.bookingIntervalMinutes} min`,
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (resource) => {
        const isSelected = resourceId === resource.resourceId;
        return (
          <button
            type="button"
            onClick={() => selectResource(resource.resourceId)}
            disabled={saving}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${isSelected
              ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
          >
            {isSelected ? "Continue" : "Select"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        );
      },
    },
  ];

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xl font-semibold uppercase tracking-wider text-indigo-600">
            Step 1 · Select a Resource
          </p>
          <p className="text-sm text-slate-500">
            Choose a category or search for a resource.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {filteredResources.length}{" "}
          {filteredResources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      <div className="max-w-xl">
        <FormField id="resource-search" label="Search resources">
          <FormInput
            id="resource-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, code, location or category..."
            disabled={loading}
          />
        </FormField>
      </div>


      <div
        className="flex max-w-full items-center gap-1 overflow-x-auto border-b border-slate-200 scrollbar-none"
        aria-label="Resource categories"
      >
        <button
          type="button"
          aria-pressed={categoryId === "all"}
          onClick={() => {
            setCategoryId("all");
            setPage(1);
          }}
          className={`group relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${categoryId === "all"
            ? "font-semibold text-indigo-600"
            : "text-slate-500 hover:-translate-y-0.5 hover:text-indigo-600"
            }`}
        >
          <span className="relative z-10">All Resources</span>
          <span
            className={`absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-indigo-600 transition-transform duration-300 ease-out ${categoryId === "all"
              ? "scale-x-100"
              : "scale-x-0 group-hover:scale-x-100"
              }`}
          />
        </button>

        {categories.map(([id, name]) => {
          const isActive = categoryId === id;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setCategoryId(id);
                setPage(1);
              }}
              className={`group relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${isActive
                ? "font-semibold text-indigo-600"
                : "text-slate-500 hover:-translate-y-0.5 hover:text-indigo-600"
                }`}
            >
              <span className="relative z-10">{name}</span>
              <span
                className={`absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-indigo-600 transition-transform duration-300 ease-out ${isActive
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
                  }`}
              />
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading resources...
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No available resources found. Ask an admin to add an available resource.
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No resources match your search or category.
        </div>
      ) : (
        <>
          {/* Desktop: reusable GenericTable */}
          <div className="hidden md:block">
            <GenericTable<Resource>
              data={visibleResources}
              columns={columns}
              getRowKey={(resource) => resource.resourceId}
              searchable={false}
              pagination={false}
            />
          </div>

          {/* Mobile: existing resource cards */}
          <div className="grid gap-3 md:hidden">
            {visibleResources.map((resource) => {
              const isSelected = resourceId === resource.resourceId;
              const categoryName =
                resource.category.categoryName.toLowerCase();
              const ResourceIcon =
                categoryName.includes("room") ||
                  categoryName.includes("hall")
                  ? Presentation
                  : Building2;

              return (
                <article
                  key={resource.resourceId}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${isSelected
                    ? "border-indigo-500 ring-1 ring-indigo-100"
                    : "border-slate-200"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <ResourceIcon
                        className="h-5 w-5"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold text-slate-900">
                        {resource.resourceName}
                      </h3>
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {resource.category.categoryName} ·{" "}
                        {resource.resourceCode}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-indigo-600"
                        aria-label="Selected"
                      />
                    )}
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      {resource.location || "Location not specified"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      {resource.capacity != null
                        ? `${resource.capacity} seats`
                        : "Capacity not specified"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                      {resource.category.bookingIntervalMinutes} min booking interval
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? "secondary" : "primary"}
                    size="md"
                    fullWidth
                    onClick={() => selectResource(resource.resourceId)}
                    disabled={saving}
                    className="group mt-4 rounded-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <span>
                      {isSelected ? "Selected — Continue" : "Select Resource"}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
                  </Button>
                </article>
              );
            })}
          </div>

          {/* Shared pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredResources.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              showPageSize={false}
              showInfo
              disabled={loading || saving}
            />
          )}
        </>
      )}
    </section>
  );
}
