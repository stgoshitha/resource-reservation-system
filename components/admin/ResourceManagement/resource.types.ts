export type ResourceStatus = "AVAILABLE" | "MAINTENANCE" | "INACTIVE";
export type Category = { categoryId: string; categoryCode: string; categoryName: string };
export type Resource = {
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  categoryId: string;
  category: Category;
  description: string | null;
  location: string | null;
  capacity: number | null;
  resourceStatus: ResourceStatus;
  createdAt: string;
};
export type ResourceForm = {
  categoryId: string;
  resourceName: string;
  description: string;
  location: string;
  capacity: string;
  resourceStatus: ResourceStatus;
};
export type ListResponse<T> = {
  message?: string;
  data?: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};
