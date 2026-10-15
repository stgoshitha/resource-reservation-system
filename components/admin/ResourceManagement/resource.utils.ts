import type { ResourceForm, ResourceStatus } from "./resource.types";

export const emptyForm: ResourceForm = {
  categoryId: "",
  resourceName: "",
  description: "",
  location: "",
  capacity: "",
  resourceStatus: "AVAILABLE",
};
export const statusLabels: Record<ResourceStatus, string> = {
  AVAILABLE: "Available",
  MAINTENANCE: "Maintenance",
  INACTIVE: "Inactive",
};
export const statusStyles: Record<ResourceStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  MAINTENANCE: "bg-amber-50 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};
export async function readResponse(response: Response): Promise<Record<string, unknown>> {
  const body: unknown = await response.json().catch(() => ({}));
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
}
export function getErrorMessage(result: Record<string, unknown>, fallback: string): string {
  const errors = result.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find((value) => typeof value === "string");
    if (typeof first === "string") return first;
  }
  return typeof result.message === "string" ? result.message : fallback;
}
