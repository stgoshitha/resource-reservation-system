"use client";
import type { FormEvent } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/form";
import FormDateTime from "@/components/ui/form/FormDateTime";
import type { Category, CategoryForm, WeeklySchedule } from "./category.types";
import { DAYS } from "./category.utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Category | null;
  saving: boolean;
  form: CategoryForm;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  updateForm: (field: keyof Omit<CategoryForm, "weeklySchedules">, value: string) => void;
  updateSchedule: (dayOfWeek: number, changes: Partial<Omit<WeeklySchedule, "dayOfWeek">>) => void;
};

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
        onChange={(event) => onChange(event.target.value)}/>
    </FormField>
  );
}
export default function CategoryFormModal({ open, onOpenChange, editing, saving, form, onSave, onCancel, updateForm, updateSchedule }: Props) {
  return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={editing ? "Edit Category" : "Add Category"}
        description="Enter the resource category details and operating hours."
        size="lg"
        position="right"
        closeOnOverlayClick={!saving}
        footer={<>
          <Button variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
          <Button type="submit" form="category-form" loading={saving}>{editing ? "Save Changes" : "Create Category"}</Button>
        </>}
      >
        <form id="category-form" onSubmit={onSave} className="space-y-5">
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
                  <div key={schedule.dayOfWeek} className="rounded-xl border border-slate-200 p-3 transition-colors duration-200 hover:border-indigo-200 hover:bg-indigo-50/30">
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
  );
}
