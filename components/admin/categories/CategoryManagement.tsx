"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField, FormInput, FormSearch, FormSelect, FormTextarea } from "@/components/ui/form";
import FormDateTime from "@/components/ui/form/FormDateTime";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import PageHeader from "@/components/ui/page-header/PageHeader";

type OperatingHoursMode = "STANDARD" | "WEEKLY" | "ALWAYS_OPEN";
type WeeklySchedule = {
  dayOfWeek: number;
  isClosed: boolean;
  openingTime: string;
  closingTime: string;
};

type Category = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  bookingIntervalMinutes: number;
  openingTime: string;
  closingTime: string;
  operatingHoursMode: OperatingHoursMode;
  weeklySchedules: WeeklySchedule[];
  createdAt: string;
};

type CategoryForm = {
  categoryCode: string;
  categoryName: string;
  description: string;
  bookingIntervalMinutes: string;
  openingTime: string;
  closingTime: string;
  operatingHoursMode: OperatingHoursMode;
  weeklySchedules: WeeklySchedule[];
};

type CategoryListResponse = {
  message?: string;
  data?: Category[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function defaultSchedules(): WeeklySchedule[] {
  return DAYS.map((_, dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    openingTime: "08:00",
    closingTime: "18:00",
  }));
}

function emptyCategoryForm(): CategoryForm {
  return {
    categoryCode: "",
    categoryName: "",
    description: "",
    bookingIntervalMinutes: "15",
    openingTime: "08:00",
    closingTime: "18:00",
    operatingHoursMode: "STANDARD",
    weeklySchedules: defaultSchedules(),
  };
}

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => ({}));
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function getErrorMessage(result: Record<string, unknown>, fallback: string): string {
  const errors = result.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find((item) => typeof item === "string");
    if (typeof first === "string") return first;
  }
  return typeof result.message === "string" ? result.message : fallback;
}

function validTimeRange(openingTime: string, closingTime: string): boolean {
  return (
    TIME_PATTERN.test(openingTime) &&
    TIME_PATTERN.test(closingTime) &&
    openingTime !== closingTime
  );
}

type TimeSelectorProps = {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function TimeSelector({ id, label, value, disabled, onChange }: TimeSelectorProps) {
  return (
    <FormField id={id} label={label} required>
      <FormDateTime
        id={id}
        mode="time"
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

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
      key: "actions", header: "Actions", render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void openEdit(row)} disabled={loadingEdit} aria-label={`Edit ${row.categoryName}`} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"><Pencil size={17} /></button>
          <button type="button" onClick={() => setDeleting(row)} aria-label={`Delete ${row.categoryName}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
        </div>
      ),
    },
  ], [loadingEdit]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage resource categories, booking intervals, and operating hours."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Categories" }]}
        actions={<Button onClick={openCreate}><Plus size={18} />Add Category</Button>}
      />
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex max-w-lg gap-2">
          <div className="min-w-0 flex-1">
            <FormSearch aria-label="Search categories" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Search category name or code..." />
          </div>
          <Button type="submit" size="sm">Search</Button>
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
        <Pagination
          currentPage={page}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          disabled={loading}
        />
      </div>
      <Modal
        open={formOpen}
        onOpenChange={(open) => { if (!saving) setFormOpen(open); }}
        title={editing ? "Edit Category" : "Add Category"}
        description="Enter the resource category details and operating hours."
        size="lg"
        position="right"
        closeOnOverlayClick={!saving}
        footer={<>
          <Button variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button type="submit" form="category-form" loading={saving}>{editing ? "Save Changes" : "Create Category"}</Button>
        </>}
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-5">
          <FormField id="category-code" label="Category Code" required>
            <FormInput id="category-code" required maxLength={20} disabled={saving} value={form.categoryCode} onChange={(event) => updateForm("categoryCode", event.target.value)} placeholder="e.g. MEETING_ROOM" />
          </FormField>
          <FormField id="category-name" label="Category Name" required>
            <FormInput id="category-name" required maxLength={100} disabled={saving} value={form.categoryName} onChange={(event) => updateForm("categoryName", event.target.value)} placeholder="e.g. Meeting Room" />
          </FormField>
          <FormField id="booking-interval" label="Booking Interval (Minutes)" required>
            <FormSelect id="booking-interval" required disabled={saving} value={form.bookingIntervalMinutes} onChange={(event) => updateForm("bookingIntervalMinutes", event.target.value)}>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">60 Minutes</option>
            </FormSelect>
          </FormField>
          <FormField id="category-description" label="Description">
            <FormTextarea id="category-description" rows={3} disabled={saving} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Enter category description" />
          </FormField>
          <div className="space-y-4 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Operating Hours</h3>
            <FormField id="operating-hours-mode" label="Operating Hours Mode" required>
              <FormSelect id="operating-hours-mode" required disabled={saving} value={form.operatingHoursMode} onChange={(event) => updateForm("operatingHoursMode", event.target.value)}>
                <option value="STANDARD">Standard (same hours every day)</option>
                <option value="WEEKLY">Weekly (different hours by day)</option>
                <option value="ALWAYS_OPEN">24/7 (always open)</option>
              </FormSelect>
            </FormField>
            {form.operatingHoursMode === "STANDARD" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TimeSelector
                  id="standard-opening-time"
                  label="Opening Time"
                  value={form.openingTime}
                  disabled={saving}
                  onChange={(value) => updateForm("openingTime", value)}
                />
                <TimeSelector
                  id="standard-closing-time"
                  label="Closing Time"
                  value={form.closingTime}
                  disabled={saving}
                  onChange={(value) => updateForm("closingTime", value)}
                />
                <p className="text-xs text-slate-500 sm:col-span-2">A closing time earlier than opening means the shift ends the next day.</p>
              </div>
            )}
            {form.operatingHoursMode === "WEEKLY" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Configure all seven days. Overnight hours are supported; closed days have no opening hours.</p>
                {form.weeklySchedules.map((schedule) => (
                  <div key={schedule.dayOfWeek} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">{DAYS[schedule.dayOfWeek]}</span>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={schedule.isClosed}
                          disabled={saving}
                          onChange={(event) => updateSchedule(schedule.dayOfWeek, { isClosed: event.target.checked })}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        Closed
                      </label>
                    </div>
                    {!schedule.isClosed && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <TimeSelector
                          id={`weekly-${schedule.dayOfWeek}-opening`}
                          label="Opens"
                          value={schedule.openingTime}
                          disabled={saving}
                          onChange={(value) => updateSchedule(schedule.dayOfWeek, { openingTime: value })}
                        />
                        <TimeSelector
                          id={`weekly-${schedule.dayOfWeek}-closing`}
                          label="Closes"
                          value={schedule.closingTime}
                          disabled={saving}
                          onChange={(value) => updateSchedule(schedule.dayOfWeek, { closingTime: value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {form.operatingHoursMode === "ALWAYS_OPEN" && (
              <p className="rounded-lg bg-indigo-50 px-3 py-3 text-sm text-indigo-700">This category is available 24 hours a day, seven days a week.</p>
            )}
          </div>
        </form>
      </Modal>
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
