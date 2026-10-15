"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSearch, FormSelect } from "@/components/ui/form";
import GenericTable from "@/components/ui/table/GenericTable";
import type { GenericTableColumn } from "@/components/ui/table/GenericTable.types";
import Pagination from "@/components/ui/pagination/Pagination";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ResourceFormModal from "./ResourceFormModal";
import type { Category, Resource, ResourceForm, ListResponse } from "./resource.types";
import { emptyForm, statusLabels, statusStyles, readResponse, getErrorMessage } from "./resource.utils";

export default function ResourceManagement() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const fetchResources = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(`/api/admin/resources?${params}`, { cache: "no-store", signal });
      const result = (await readResponse(response)) as ListResponse<Resource>;
      if (!response.ok) throw new Error(result.message || "Failed to load resources");
      if (!Array.isArray(result.data) || !result.pagination) throw new Error("Unexpected resource response");
      if (signal.aborted) return;
      setResources(result.data);
      setTotal(result.pagination.total);
      if (page > 1 && result.pagination.totalPages < page) {
        setPage(Math.max(1, result.pagination.totalPages));
      }
    } catch (error) {
      if (signal.aborted) return;
      toast.error(error instanceof Error ? error.message : "Failed to load resources");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, pageSize, search, categoryFilter, statusFilter]);
  useEffect(() => {
    const controller = new AbortController();
    void fetchResources(controller.signal);
    return () => controller.abort();
  }, [fetchResources, refreshKey]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        // Category API has a maximum of 100 results per page.
        const all: Category[] = [];
        let currentPage = 1;
        while (!controller.signal.aborted) {
          const response = await fetch(`/api/admin/categories?page=${currentPage}&limit=100`, {
            cache: "no-store", signal: controller.signal,
          });
          const result = (await readResponse(response)) as ListResponse<Category>;
          if (!response.ok) throw new Error(result.message || "Failed to load categories");
          if (!Array.isArray(result.data) || !result.pagination) throw new Error("Unexpected category response");
          all.push(...result.data);
          if (currentPage >= result.pagination.totalPages) break;
          currentPage += 1;
        }
        if (!controller.signal.aborted) setCategories(all);
      } catch (error) {
        if (!controller.signal.aborted) toast.error(error instanceof Error ? error.message : "Failed to load categories");
      } finally {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      }
    }
    void loadCategories();
    return () => controller.abort();
  }, []);
  function refresh() { setRefreshKey((current) => current + 1); }
  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  }
  function openEdit(resource: Resource) {
    setEditing(resource);
    setForm({
      categoryId: resource.categoryId,
      resourceName: resource.resourceName,
      description: resource.description ?? "",
      location: resource.location ?? "",
      capacity: resource.capacity == null ? "" : String(resource.capacity),
      resourceStatus: resource.resourceStatus,
    });
    setFormOpen(true);
  }
  function updateForm<K extends keyof ResourceForm>(field: K, value: ResourceForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!form.categoryId) { toast.error("Select a category"); return; }
    if (!form.resourceName.trim()) { toast.error("Enter a resource name"); return; }
    const capacity = form.capacity.trim() === "" ? undefined : Number(form.capacity);
    if (capacity !== undefined && (!Number.isSafeInteger(capacity) || capacity < 1)) {
      toast.error("Capacity must be a positive whole number");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/admin/resources/${editing.resourceId}` : "/api/admin/resources",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: form.categoryId,
            resourceName: form.resourceName.trim(),
            ...(form.description.trim() ? { description: form.description.trim() } : {}),
            ...(form.location.trim() ? { location: form.location.trim() } : {}),
            ...(capacity !== undefined ? { capacity } : {}),
            resourceStatus: form.resourceStatus,
          }),
        }
      );
      const result = await readResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(result, "Failed to save resource"));
      toast.success(editing ? "Resource updated successfully" : "Resource created successfully");
      setFormOpen(false);
      setEditing(null);
      setPage(1);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save resource");
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete() {
    if (!deleting) return;
    try {
      const response = await fetch(`/api/admin/resources/${deleting.resourceId}`, { method: "DELETE" });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(result, "Failed to delete resource"));
      toast.success("Resource deleted successfully");
      setDeleting(null);
      if (resources.length === 1 && page > 1) setPage((current) => current - 1);
      else refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete resource");
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
    setCategoryFilter("");
    setStatusFilter("");
  }
  const columns = useMemo<GenericTableColumn<Resource>[]>(() => [
    { key: "code", header: "Code", accessor: "resourceCode", render: (row) => (
      <span className="font-medium text-indigo-600">{row.resourceCode}</span>
    ) },
    { key: "name", header: "Resource Name", accessor: "resourceName" },
    { key: "category", header: "Category", render: (row) => row.category?.categoryName ?? "—" },
    { key: "location", header: "Location", accessor: "location", render: (row) => row.location || "—" },
    { key: "capacity", header: "Capacity", accessor: "capacity", render: (row) => row.capacity ?? "—" },
    { key: "status", header: "Status", accessor: "resourceStatus", render: (row) => (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.resourceStatus]}`}>
        {statusLabels[row.resourceStatus]}
      </span>
    ) },
    { key: "actions", header: "Actions", align: "right", render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${row.resourceName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo-600 transition hover:bg-indigo-50"><Pencil size={17} /></button>
        <button type="button" onClick={() => setDeleting(row)} aria-label={`Delete ${row.resourceName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"><Trash2 size={17} /></button>
      </div>
    ) },
  ], []);
  return (
    <div className="min-w-0 space-y-7">
      <PageHeader
        title="Resource Management"
        description="Manage resources, their categories, availability, and capacity."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Resources" }]}
        actions={<Button onClick={openCreate} disabled={categoriesLoading || categories.length === 0}><Plus size={18} />Add Resource</Button>}
      />
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <FormSearch aria-label="Search resources" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="Search resource name or code..." />
          </div>
          <div className="w-full lg:w-64">
            <FormSelect aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} placeholder="All Categories">
              <option value="">All Categories</option>
              {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}
            </FormSelect>
          </div>
          <div className="w-full lg:w-56">
            <FormSelect aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} placeholder="All Statuses">
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </FormSelect>
          </div>
          <button type="submit" className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!searchInput && !search && !categoryFilter && !statusFilter}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </form>
        <GenericTable<Resource>
          data={resources}
          columns={columns}
          getRowKey={(row) => row.resourceId}
          loading={loading}
          searchable={false}
          pagination={false}
          emptyMessage="No resources found."
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
      <ResourceFormModal
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editing={editing}
        saving={saving}
        categoriesLoading={categoriesLoading}
        categories={categories}
        form={form}
        updateForm={updateForm}
        handleSave={handleSave}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete Resource"
        description={`Are you sure you want to delete "${deleting?.resourceName ?? ""}"? Resources with reservation history cannot be deleted; set their status to INACTIVE instead.`}
        confirmText="Delete Resource"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}