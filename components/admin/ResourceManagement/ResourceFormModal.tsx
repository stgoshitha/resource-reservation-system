"use client";

import type { FormEvent } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormField, FormInput, FormNumber, FormSelect, FormTextarea } from "@/components/ui/form";
import type { Category, Resource, ResourceForm, ResourceStatus } from "./resource.types";

type Props = {
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  editing: Resource | null;
  saving: boolean;
  categoriesLoading: boolean;
  categories: Category[];
  form: ResourceForm;
  updateForm: <K extends keyof ResourceForm>(field: K, value: ResourceForm[K]) => void;
  handleSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function ResourceFormModal({
  formOpen, setFormOpen, editing, saving, categoriesLoading,
  categories, form, updateForm, handleSave,
}: Props) {
  return (
      <Modal
        open={formOpen}
        onOpenChange={(open) => { if (!saving) setFormOpen(open); }}
        title={editing ? "Edit Resource" : "Add Resource"}
        description={editing ? `Editing ${editing.resourceCode}` : "Resource code will be generated automatically."}
        size="md"
        position="right"
        closeOnOverlayClick={!saving}
        footer={<>
          <Button variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button type="submit" form="resource-form" loading={saving}>{editing ? "Save Changes" : "Create Resource"}</Button>
        </>}
      >
        <form id="resource-form" onSubmit={handleSave} className="space-y-5">
          <FormField id="resource-category" label="Category" required>
            <FormSelect id="resource-category" required disabled={saving || categoriesLoading} value={form.categoryId} onChange={(event) => updateForm("categoryId", event.target.value)} placeholder="Select category">
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}
            </FormSelect>
          </FormField>
          <FormField id="resource-name" label="Resource Name" required>
            <FormInput id="resource-name" required disabled={saving} value={form.resourceName} onChange={(event) => updateForm("resourceName", event.target.value)} minLength={2} maxLength={150} placeholder="e.g. Meeting Room A" />
          </FormField>
          <FormField id="resource-location" label="Location">
            <FormInput id="resource-location" disabled={saving} value={form.location} onChange={(event) => updateForm("location", event.target.value)} maxLength={200} placeholder="e.g. Building A, Floor 2" />
          </FormField>
          <FormField id="resource-capacity" label="Capacity">
            <FormNumber id="resource-capacity" min={1} step={1} disabled={saving} value={form.capacity} onChange={(event) => updateForm("capacity", event.target.value)} placeholder="e.g. 10" />
          </FormField>
          <FormField id="resource-status" label="Resource Status" required>
            <FormSelect id="resource-status" required disabled={saving} value={form.resourceStatus} onChange={(event) => updateForm("resourceStatus", event.target.value as ResourceStatus)}>
              <option value="AVAILABLE">Available</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </FormSelect>
          </FormField>
          <FormField id="resource-description" label="Description">
            <FormTextarea id="resource-description" rows={3} disabled={saving} value={form.description} onChange={(event) => updateForm("description", event.target.value)} maxLength={1000} placeholder="Enter resource description" />
          </FormField>
        </form>
      </Modal>
  );
}
