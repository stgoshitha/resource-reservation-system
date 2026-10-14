"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField, FormInput, FormNumber, FormSearch, FormSelect, FormTextarea } from "@/components/ui/form";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import PageHeader from "@/components/ui/page-header/PageHeader";

type Category = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  bookingIntervalMinutes: number;
  createdAt: string;
};

type CategoryForm = {
  categoryCode: string;
  categoryName: string;
  description: string;
  bookingIntervalMinutes: string;
};

type CategoryListResponse = {
  message?: string;
  data?: Category[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

const emptyForm: CategoryForm = {
  categoryCode: "",
  categoryName: "",
  description: "",
  bookingIntervalMinutes: "15",
};

async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => ({}));
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
}

function getErrorMessage(result: Record<string, unknown>, fallback: string): string {
  const errors = result.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find((item) => typeof item === "string");
    if (typeof first === "string") return first;
  }
  return typeof result.message === "string" ? result.message : fallback;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const fetchCategories = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize), search });
      const response = await fetch(`/api/admin/categories?${params}`, { cache: "no-store", signal });
      const result = (await readResponse(response)) as CategoryListResponse;
      if (!response.ok) throw new Error(result.message || "Failed to load categories");
      if (!Array.isArray(result.data) || !result.pagination) throw new Error("Unexpected category response");
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

  function refresh() { setRefreshKey((value) => value + 1); }
  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  }
  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      categoryCode: category.categoryCode,
      categoryName: category.categoryName,
      description: category.description ?? "",
      bookingIntervalMinutes: String(category.bookingIntervalMinutes),
    });
    setFormOpen(true);
  }
  function updateForm(field: keyof CategoryForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const interval = Number(form.bookingIntervalMinutes);
    if (!Number.isSafeInteger(interval) || interval <= 0) {
      toast.error("Enter a valid booking interval");
      return;
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
            description: form.description.trim() || null,
            bookingIntervalMinutes: interval,
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
      const response = await fetch(`/api/admin/categories/${deleting.categoryId}`, { method: "DELETE" });
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
      )
    },
    { key: "name", header: "Category Name", accessor: "categoryName" },
    {
      key: "description", header: "Description", accessor: "description", render: (row) => (
        <span className="block max-w-56 truncate" title={row.description ?? ""}>{row.description || "—"}</span>
      )
    },
    {
      key: "interval", header: "Interval", accessor: "bookingIntervalMinutes", render: (row) => (
        <span>{row.bookingIntervalMinutes} min</span>
      )
    },
    {
      key: "created", header: "Created", accessor: "createdAt", render: (row) => (
        <span>{new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeZone: "Asia/Colombo" }).format(new Date(row.createdAt))}</span>
      )
    },
    {
      key: "actions", header: "Actions", render: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${row.categoryName}`} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Pencil size={17} /></button>
          <button type="button" onClick={() => setDeleting(row)} aria-label={`Delete ${row.categoryName}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
        </div>
      )
    },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage resource categories and booking intervals."
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
        description="Enter the resource category details."
        size="md"
        position="right"
        closeOnOverlayClick={!saving}
        footer={<>
          <Button variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button type="submit" form="category-form" loading={saving}>{editing ? "Save Changes" : "Create Category"}</Button>
        </>}
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-5">
          <FormField id="category-code" label="Category Code" required>
            <FormInput
              id="category-code"
              required maxLength={20}
              disabled={saving}
              value={form.categoryCode}
              onChange={(event) => updateForm("categoryCode", event.target.value)}
              placeholder="e.g. MEETING_ROOM" />
          </FormField>
          <FormField id="category-name" label="Category Name" required>
            <FormInput
              id="category-name"
              required maxLength={100}
              disabled={saving}
              value={form.categoryName}
              onChange={(event) => updateForm("categoryName", event.target.value)}
              placeholder="e.g. Meeting Room" />
          </FormField>
          <FormField id="booking-interval" label="Booking Interval (Minutes)" required>
            <FormSelect
              id="booking-interval"
              required
              disabled={saving}
              value={form.bookingIntervalMinutes}
              onChange={(event) => updateForm("bookingIntervalMinutes", event.target.value)}>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">60 Minutes</option>
            </FormSelect>
          </FormField>
          <FormField id="category-description" label="Description">
            <FormTextarea
              id="category-description"
              rows={3}
              disabled={saving}
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Enter category description" />
          </FormField>
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
