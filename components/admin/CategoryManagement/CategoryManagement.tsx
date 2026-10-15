"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSearch } from "@/components/ui/form";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import PageHeader from "@/components/ui/page-header/PageHeader";
import CategoryFormModal from "./CategoryFormModal";
import type { Category, CategoryForm, CategoryListResponse, WeeklySchedule } from "./category.types";
import { DAYS, defaultSchedules, emptyCategoryForm, readResponse, getErrorMessage, validTimeRange } from "./category.utils";
export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategoryForm);
  const [deleting, setDeleting] = useState<Category | null>(null);
  // Load categories with server-side search and pagination.
  const fetchCategories = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize), search });
      const response = await fetch(`/api/admin/categories?${params}`, { cache: "no-store", signal });
      const result = (await readResponse(response)) as CategoryListResponse;
      if (!response.ok) throw new Error(result.message || "Failed to load categories");
      if (!Array.isArray(result.data) || !result.pagination) {
        throw new Error("Unexpected category response");
      }
      if (signal.aborted) return;
      setCategories(result.data);
      setTotal(result.pagination.total);
      if (page > 1 && result.pagination.totalPages < page) {
        setPage(Math.max(1, result.pagination.totalPages));
      }
    } catch (error) {
      if (signal.aborted) return;
      toast.error(error instanceof Error ? error.message : "Failed to load categories");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, pageSize, search]);
  useEffect(() => {
    const controller = new AbortController();
    void fetchCategories(controller.signal);
    return () => controller.abort();
  }, [fetchCategories, refreshKey]);
  function refresh() {
    setRefreshKey((value) => value + 1);
  }
  function openCreate() {
    setEditing(null);
    setForm(emptyCategoryForm());
    setFormOpen(true);
  }
  // Fetch fresh category details before editing weekly schedules.
  async function openEdit(category: Category) {
    if (loadingEdit) return;
    setLoadingEdit(true);
    try {
      // Read the latest detail so weekday values cannot be lost by a stale list row.
      const response = await fetch(`/api/admin/categories/${category.categoryId}`, {
        cache: "no-store",
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(result, "Failed to load category"));
      const detail = result.category as Category | undefined;
      if (!detail) throw new Error("Unexpected category response");
      const scheduleMap = new Map(
        (detail.weeklySchedules ?? []).map((schedule) => [schedule.dayOfWeek, schedule])
      );
      setEditing(detail);
      setForm({
        categoryCode: detail.categoryCode,
        categoryName: detail.categoryName,
        description: detail.description ?? "",
        bookingIntervalMinutes: String(detail.bookingIntervalMinutes),
        openingTime: detail.openingTime ?? "08:00",
        closingTime: detail.closingTime ?? "18:00",
        operatingHoursMode: detail.operatingHoursMode ?? "STANDARD",
        weeklySchedules: defaultSchedules().map((defaultSchedule) => {
          const saved = scheduleMap.get(defaultSchedule.dayOfWeek);
          return saved
            ? {
                dayOfWeek: defaultSchedule.dayOfWeek,
                isClosed: saved.isClosed,
                openingTime: saved.openingTime,
                closingTime: saved.closingTime,
              }
            : defaultSchedule;
        }),
      });
      setFormOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load category");
    } finally {
      setLoadingEdit(false);
    }
  }
  function updateForm(field: keyof Omit<CategoryForm, "weeklySchedules">, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function updateSchedule(dayOfWeek: number, changes: Partial<Omit<WeeklySchedule, "dayOfWeek">>) {
    setForm((current) => ({
      ...current,
      weeklySchedules: current.weeklySchedules.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...changes } : schedule
      ),
    }));
  }
  // Validate operating hours before submitting category changes.
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const interval = Number(form.bookingIntervalMinutes);
    if (![15, 30, 60].includes(interval)) {
      toast.error("Select a valid booking interval");
      return;
    }
    if (form.operatingHoursMode === "STANDARD" && !validTimeRange(form.openingTime, form.closingTime)) {
      toast.error("Opening and closing times must be valid and different");
      return;
    }
    if (form.operatingHoursMode === "WEEKLY") {
      const invalid = form.weeklySchedules.find(
        (schedule) => !schedule.isClosed && !validTimeRange(schedule.openingTime, schedule.closingTime)
      );
      if (invalid) {
        toast.error(`Enter valid, different opening and closing times for ${DAYS[invalid.dayOfWeek]}`);
        return;
      }
    }
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/admin/categories/${editing.categoryId}` : "/api/admin/categories",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryCode: form.categoryCode.trim(),
            categoryName: form.categoryName.trim(),
            // The backend schema expects an optional string, not null.
            description: form.description.trim(),
            bookingIntervalMinutes: interval,
            operatingHoursMode: form.operatingHoursMode,
            openingTime: form.openingTime,
            closingTime: form.closingTime,
            ...(form.operatingHoursMode === "WEEKLY"
              ? { weeklySchedules: form.weeklySchedules }
              : {}),
          }),
        }
      );
      const result = await readResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(result, "Failed to save category"));
      toast.success(editing ? "Category updated successfully" : "Category created successfully");
      setFormOpen(false);
      setEditing(null);
      setPage(1);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }
  // Delete the selected category and refresh the current page.
  async function handleDelete() {
    if (!deleting) return;
    try {
      const response = await fetch(`/api/admin/categories/${deleting.categoryId}`, {
        method: "DELETE",
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(result, "Failed to delete category"));
      toast.success("Category deleted successfully");
      setDeleting(null);
      if (categories.length === 1 && page > 1) setPage((value) => value - 1);
      else refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
      throw error;
    }
  }
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }
  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }
  const columns = useMemo<GenericTableColumn<Category>[]>(() => [
    {
      key: "code", header: "Code", accessor: "categoryCode", render: (row) => (
        <span className="font-medium text-indigo-600">{row.categoryCode}</span>
      ),
    },
    { key: "name", header: "Category Name", accessor: "categoryName" },
    {
      key: "description", header: "Description", accessor: "description", render: (row) => (
        <span className="block max-w-56 truncate" title={row.description ?? ""}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "interval", header: "Interval", accessor: "bookingIntervalMinutes", render: (row) => (
        <span>{row.bookingIntervalMinutes} min</span>
      ),
    },
    {
      key: "hours", header: "Operating Hours", render: (row) => (
        <span className="whitespace-nowrap text-sm">
          {row.operatingHoursMode === "ALWAYS_OPEN"
            ? "24/7"
            : row.operatingHoursMode === "WEEKLY"
              ? "Weekly schedule"
              : `${row.openingTime}–${row.closingTime}`}
        </span>
      ),
    },
    {
      key: "created", header: "Created", accessor: "createdAt", render: (row) => (
        <span>{new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeZone: "Asia/Colombo" }).format(new Date(row.createdAt))}</span>
      ),
    },
    {
      key: "actions", header: "Actions", align: "right", render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => void openEdit(row)} disabled={loadingEdit} aria-label={`Edit ${row.categoryName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"><Pencil size={17} /></button>
          <button type="button" onClick={() => setDeleting(row)} aria-label={`Delete ${row.categoryName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"><Trash2 size={17} /></button>
        </div>
      ),
    },
  ], [loadingEdit]);
  return (
    <div className="min-w-0 space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <PageHeader
        title="Category Management"
        description="Manage resource categories, booking intervals, and operating hours."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Categories" }]}
        actions={<Button onClick={openCreate}><Plus size={18} />Add Category</Button>}
      />
      <div className="min-w-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <FormSearch aria-label="Search categories" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Search category name or code..." />
          </div>
          <button type="submit" className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!searchInput && !search}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </form>
        <GenericTable<Category>
          data={categories}
          columns={columns}
          getRowKey={(row) => row.categoryId}
          loading={loading}
          searchable={false}
          pagination={false}
          emptyMessage="No categories found."
        />
        <div className="rounded-2xl border border-slate-200 bg-white px-5 pb-4 shadow-sm">
          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            showPageSize={false}
            showInfo
            disabled={loading}
          />
        </div>
      </div>
      <CategoryFormModal
        open={formOpen}
        onOpenChange={(open) => { if (!saving) setFormOpen(open); }}
        editing={editing}
        saving={saving}
        form={form}
        onSave={handleSave}
        onCancel={() => setFormOpen(false)}
        updateForm={updateForm}
        updateSchedule={updateSchedule}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleting?.categoryName ?? ""}"? This action cannot be undone.`}
        confirmText="Delete Category"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
