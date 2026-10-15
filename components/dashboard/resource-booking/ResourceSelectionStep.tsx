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
import Pagination from "@/components/ui/pagination/Pagination";
import { FormField, FormInput } from "@/components/ui/form";
import type { BookingModel } from "./useResourceBooking";

const PAGE_SIZE = 6;

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

  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:space-y-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 sm:text-lg">Step 1· Select a Resource</p>
          </div>
        </div>
        <div className="w-full lg:w-md">
          <FormField id="resource-search" label="">
            <FormInput
              id="resource-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search resources..."
              disabled={loading}
            />
          </FormField>
        </div>
      </div>

      {!loading && resources.length > 0 && (
        <div className="flex justify-start sm:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3.5 py-2 text-xs font-medium text-indigo-700 sm:text-sm">
            <Layers3 className="h-4 w-4 shrink-0" aria-hidden="true" />

            <span className="font-bold tabular-nums">
              {filteredResources.length}
            </span>

            <span>
              {filteredResources.length === 1 ? "resource" : "resources"} found
            </span>
          </div>
        </div>
      )}

      <div
        className="flex w-full min-w-0 items-center gap-1 overflow-x-auto border-b border-slate-200 scrollbar-none"
        aria-label="Resource categories"
      >
        <button
          type="button"
          aria-pressed={categoryId === "all"}
          onClick={() => {
            setCategoryId("all");
            setPage(1);
          }}
          className={`group relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${categoryId === "all"
            ? "font-semibold text-indigo-600"
            : "text-slate-500 hover:text-indigo-600"
            }`}
        >
          All Resources
          <span
            className={`absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-indigo-600 transition-transform duration-300 ${categoryId === "all"
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
              className={`group relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${isActive
                ? "font-semibold text-indigo-600"
                : "text-slate-500 hover:text-indigo-600"
                }`}
            >
              {name}
              <span
                className={`absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-indigo-600 transition-transform duration-300 ${isActive
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
          <div className="min-w-0 space-y-3">
            {visibleResources.map((resource) => {
              const isSelected = resourceId === resource.resourceId;
              const categoryName = resource.category.categoryName.toLowerCase();
              const ResourceIcon =
                categoryName.includes("room") || categoryName.includes("hall")
                  ? Presentation
                  : Building2;

              return (
                <article
                  key={resource.resourceId}
                  className={`min-w-0 rounded-xl border bg-white p-3 transition-colors sm:p-5 ${isSelected
                    ? "border-indigo-500 bg-indigo-50/20"
                    : "border-slate-200 hover:border-indigo-200"
                    }`}
                >
                  <div className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-12 sm:w-12">
                      <ResourceIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-semibold text-slate-900 sm:text-lg">
                          {resource.resourceName}
                        </h3>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Selected" />
                        )}
                      </div>
                      <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
                        {resource.category.categoryName} · {resource.resourceCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectResource(resource.resourceId)}
                      disabled={saving}
                      className={`col-span-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold sm:col-span-1 sm:w-auto transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${isSelected
                        ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                      {!isSelected && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <div className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:mt-4 sm:flex sm:flex-wrap sm:gap-x-5 sm:border-t-0 sm:pt-0 sm:text-sm">
                    <span className="col-span-2 inline-flex min-w-0 items-start gap-1.5 sm:col-span-1 sm:items-center">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="min-w-0 break-all sm:break-words">{resource.location || "Location not specified"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {resource.capacity != null ? `${resource.capacity} seats` : "Capacity not specified"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {resource.category.bookingIntervalMinutes} min
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredResources.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                showPageSize={false}
                showInfo
                disabled={loading || saving}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
