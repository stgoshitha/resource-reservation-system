"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Presentation,
  Users,
  Layers3
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import BookingTimeSlotGrid from "@/components/dashboard/BookingTimeSlotGrid";
import { isBookingTimeAligned } from "@/src/lib/config/booking-timezone";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form";
type Resource = {
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  location: string | null;
  capacity: number | null;
  category: {
    categoryId: string;
    categoryName: string;
    bookingIntervalMinutes: number;
  };
};
const PAGE_SIZE = 6;
async function readResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
function messageOf(data: Record<string, unknown>, fallback: string) {
  return typeof data.message === "string" ? data.message : fallback;
}
export default function ResourceBooking() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resourceId, setResourceId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [step, setStep] = useState(1);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/resources", { cache: "no-store" });
        const data = await readResponse(response);
        if (!response.ok) throw new Error(messageOf(data, "Could not load resources"));
        if (active) {
          setResources(Array.isArray(data.resources) ? (data.resources as Resource[]) : []);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load resources");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    resources.forEach((resource) => {
      unique.set(resource.category.categoryId, resource.category.categoryName);
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [resources]);
  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesCategory = categoryId === "all" || resource.category.categoryId === categoryId;
      const matchesSearch = !query || [
        resource.resourceName,
        resource.resourceCode,
        resource.location ?? "",
        resource.category.categoryName,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [resources, categoryId, search]);
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleResources = filteredResources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = resources.find((resource) => resource.resourceId === resourceId);
  function resetAvailability() {
    setSuccess(false);
  }
  function selectResource(id: string) {
    if (saving) return;
    if (id !== resourceId) {
      setResourceId(id);
      setStartTime("");
      setEndTime("");
      resetAvailability();
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const handleGridSelection = useCallback((start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    setSuccess(false);
  }, []);
  function getTimeRange() {
    if (!resourceId || !startTime || !endTime) {
      throw new Error("Select a resource, start time and end time.");
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new Error("Invalid date or time.");
    }
    if (start.getTime() <= Date.now()) throw new Error("Start time must be in the future.");
    if (end.getTime() <= start.getTime()) throw new Error("End time must be after start time.");
    const interval = selected?.category.bookingIntervalMinutes ?? 15;
    const duration = end.getTime() - start.getTime();
    if (duration < interval * 60_000) {
      throw new Error(`Minimum booking duration is ${interval} minutes.`);
    }
    if (
      !isBookingTimeAligned(start, interval) ||
      !isBookingTimeAligned(end, interval)
    ) {
      throw new Error(`Choose times aligned to ${interval}-minute intervals.`);
    }
    return { startTime: start.toISOString(), endTime: end.toISOString() };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 4) return;
    if (title.trim().length < 2 || title.trim().length > 150) {
      return toast.error("Title must be 2–150 characters.");
    }
    if (notes.trim().length > 1000) return toast.error("Notes cannot exceed 1000 characters.");
    try {
      const times = getTimeRange();
      setSaving(true);
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          title: title.trim(),
          ...times,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      const data = await readResponse(response);
      if (!response.ok) {
        if (response.status === 409) {
          setScheduleRefresh((value) => value + 1);
          setStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
          throw new Error(messageOf(data, "This time slot is no longer available. Please select another slot."));
        }
        throw new Error(messageOf(data, "Reservation could not be created"));
      }
      toast.success("Reservation confirmed successfully!");
      setSuccess(true);
      setScheduleRefresh((value) => value + 1);
      setTitle("");
      setNotes("");
      setStartTime("");
      setEndTime("");
      setResourceId("");
      setStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reservation could not be created");
    } finally {
      setSaving(false);
    }
  }
  const steps = ["Select Resource", "Date & Time", "Booking Details", "Review & Confirm"];
  const validSelection = Boolean(startTime && endTime);
  const validDetails = title.trim().length >= 2 && title.trim().length <= 150 && notes.trim().length <= 1000;
  const formatTime = (value: string) => value ? new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value)) : "Not selected";
  function nextStep() {
    if (step === 1 && !selected) return toast.error("Select a resource first.");
    if (step === 2) {
      if (!validSelection) return toast.error("Select a date and available time slots.");
      try { getTimeRange(); } catch (error) {
        return toast.error(error instanceof Error ? error.message : "Invalid time range");
      }
    }
    if (step === 3 && !validDetails) return toast.error("Enter a title (2–150 characters) and keep notes within 1000 characters.");
    setStep((value) => Math.min(4, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Resource</h1>
        <p className="mt-1 text-sm text-slate-500">Reserve a resource in four simple steps.</p>
      </div>
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Reservation created successfully. <Link href="/dashboard/reservations" className="font-semibold underline">View My Reservations</Link>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">New Reservation</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Step {step} of 4</span>
        </div>
        <div role="progressbar" aria-label="Reservation progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step} className="mb-4 flex gap-1.5">
          {steps.map((label, index) => <div key={label} className={`h-2 flex-1 rounded-full ${index < step ? "bg-indigo-600" : "bg-slate-200"}`} />)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {steps.map((label, index) => {
            const number = index + 1;
            return (
              <button key={label} type="button" disabled={number >= step || saving}
                onClick={() => setStep(number)}
                className="flex flex-col items-center gap-2 rounded-lg p-1 text-center disabled:cursor-default">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${number < step ? "bg-emerald-100 text-emerald-700" : number === step ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {number < step ? "✓" : number}
                </span>
                <span className={`text-[10px] sm:text-xs ${number === step ? "font-semibold text-indigo-700" : "text-slate-500"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {step === 1 && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Browse Resources</h2>
              <p className="text-sm text-slate-500">Choose a category or search for a resource.</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {filteredResources.length} {filteredResources.length === 1 ? "resource" : "resources"}
            </span>
          </div>
          <div className="max-w-xl">
            <FormField id="resource-search" label="Search resources">
              <FormInput
                id="resource-search"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search by name, code, location or category..."
                disabled={loading}
              />
            </FormField>
          </div>
          <div
            className="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
            aria-label="Resource categories"
          >
            <button
              type="button"
              aria-pressed={categoryId === "all"}
              onClick={() => {
                setCategoryId("all");
                setPage(1);
              }}
              className={`
      shrink-0 whitespace-nowrap rounded-full border
      px-4 py-2 text-sm font-medium transition
      ${categoryId === "all"
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                }
    `}
            >
              All Resources
            </button>

            {categories.map(([id, name]) => (
              <button
                key={id}
                type="button"
                aria-pressed={categoryId === id}
                onClick={() => {
                  setCategoryId(id);
                  setPage(1);
                }}
                className={`
        shrink-0 whitespace-nowrap rounded-full border
        px-4 py-2 text-sm font-medium transition
        ${categoryId === id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  }
      `}
              >
                {name}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">Loading resources...</div>
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
              {/* Desktop / tablet: easy-to-scan resource table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] table-fixed text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="w-[30%] px-5 py-3.5">Resource</th>
                        <th scope="col" className="w-[22%] px-4 py-3.5">Location</th>
                        <th scope="col" className="w-[12%] px-4 py-3.5">Capacity</th>
                        <th scope="col" className="w-[16%] px-4 py-3.5">Interval</th>
                        <th scope="col" className="w-[20%] px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleResources.map((resource) => {
                        const isSelected = resourceId === resource.resourceId;
                        return (
                          <tr
                            key={resource.resourceId}
                            className={`transition-colors ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/70"}`}
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                  <Layers3 className="h-5 w-5" strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-semibold text-slate-900" title={resource.resourceName}>
                                      {resource.resourceName}
                                    </span>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" aria-label="Selected" />}
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-slate-500" title={`${resource.category.categoryName} · ${resource.resourceCode}`}>
                                    {resource.category.categoryName} · {resource.resourceCode}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-middle text-slate-600">
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="line-clamp-2">{resource.location || "Not specified"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-4 align-middle text-slate-600">
                              {resource.capacity != null ? `${resource.capacity} seats` : "—"}
                            </td>
                            <td className="px-4 py-4 align-middle text-slate-600">
                              {resource.category.bookingIntervalMinutes} min
                            </td>
                            <td className="px-5 py-4 text-right align-middle">
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Mobile: readable cards without horizontal table scrolling */}
              <div className="grid gap-3 md:hidden">
                {visibleResources.map((resource) => {
                  const isSelected = resourceId === resource.resourceId;
                  const categoryName = resource.category.categoryName.toLowerCase();
                  const ResourceIcon = categoryName.includes("room") || categoryName.includes("hall")
                    ? Presentation
                    : Building2;
                  return (
                    <article
                      key={resource.resourceId}
                      className={`rounded-xl border bg-white p-4 shadow-sm ${isSelected ? "border-indigo-500 ring-1 ring-indigo-100" : "border-slate-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <ResourceIcon className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-semibold text-slate-900">{resource.resourceName}</h3>
                          <p className="mt-1 break-words text-xs text-slate-500">
                            {resource.category.categoryName} · {resource.resourceCode}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" aria-label="Selected" />}
                      </div>
                      <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{resource.location || "Location not specified"}</p>
                        <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-slate-400" />{resource.capacity != null ? `${resource.capacity} seats` : "Capacity not specified"}</p>
                        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-slate-400" />{resource.category.bookingIntervalMinutes} min booking interval</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectResource(resource.resourceId)}
                        disabled={saving}
                        className={`mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 ${isSelected ? "border border-indigo-200 bg-indigo-50 text-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                      >
                        {isSelected ? "Selected — Continue" : "Select Resource"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredResources.length)} of {filteredResources.length}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <span className="text-sm text-slate-600">{currentPage} / {totalPages}</span>
                    <Button type="button" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {selected && (
        <section hidden={step !== 2} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Step 2 · Select Date & Time</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Choose your booking time</h2>
            <p className="mt-1 text-sm text-slate-500">{selected.resourceName} · {selected.category.categoryName}</p>
          </div>
          <BookingTimeSlotGrid
            key={selected.resourceId}
            resourceId={selected.resourceId}
            intervalMinutes={selected.category.bookingIntervalMinutes}
            refreshKey={scheduleRefresh}
            disabled={saving}
            onSelectionChange={handleGridSelection}
          />
        </section>
      )}
      {step === 3 && selected && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Step 3 · Booking Details</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Tell us about your reservation</h2>
            <p className="mt-1 text-sm text-slate-500">{selected.resourceName} · {formatTime(startTime)} – {formatTime(endTime)}</p>
          </div>
          <FormField id="reservation-title" label="Reservation title" required>
            <FormInput id="reservation-title" value={title} onChange={(event) => { setTitle(event.target.value); resetAvailability(); }} maxLength={150} placeholder="e.g. Team meeting" required disabled={saving} />
          </FormField>
          <FormField id="booking-notes" label="Notes (optional)">
            <FormTextarea id="booking-notes" value={notes} onChange={(event) => { setNotes(event.target.value); resetAvailability(); }} maxLength={1000} rows={4} placeholder="Additional information" disabled={saving} />
          </FormField>
        </section>
      )}
      {step === 4 && selected && (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Step 4 · Review & Confirm</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Review your reservation</h2>
            <p className="mt-1 text-sm text-slate-500">Check your booking details before confirming.</p>
          </div>
          <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
            {[
              ["Resource", selected.resourceName],
              ["Code", selected.resourceCode],
              ["Category", selected.category.categoryName],
              ["Start", formatTime(startTime)],
              ["End", formatTime(endTime)],
              ["Duration", `${Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} minutes`],
              ["Title", title.trim()],
              ["Notes", notes.trim() || "None"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving} disabled={saving}>Confirm Reservation</Button>
          </div>
          <p className="text-xs text-slate-500">The server verifies availability when you confirm and prevents overlapping bookings.</p>
        </form>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={step === 1 || saving}
          onClick={() => { setStep((value) => Math.max(1, value - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Back</Button>
        {step < 4 && (
          <Button type="button" disabled={saving || (step === 1 && !selected) || (step === 2 && !validSelection) || (step === 3 && !validDetails)} onClick={nextStep}>
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
}
