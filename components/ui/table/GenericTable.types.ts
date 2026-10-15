import type { Key, ReactNode } from "react";

export interface GenericTableColumn<T> {
  /**
   * Unique identifier for the column.
   * Example: "name", "status", "actions".
   */
  key: string;

  /**
   * Column heading.
   */
  header: string;

  /**
   * Property to display from the data object.
   * Optional when using a custom render function.
   */
  accessor?: keyof T;

  /**
   * Custom cell content.
   * Useful for status badges, buttons, and formatted dates.
   */
  render?: (row: T, index: number) => ReactNode;

  /**
   * Optional column alignment.
   */
  align?: "left" | "center" | "right";

  /**
   * Optional Tailwind CSS classes.
   */
  className?: string;

  /**
   * Whether the column can be sorted.
   */
  sortable?: boolean;
}

export interface GenericTableProps<T> {
  /**
   * Table data.
   */
  data: T[];

  /**
   * Column definitions.
   */
  columns: GenericTableColumn<T>[];

  /**
   * Unique key for each row.
   */
  getRowKey: (row: T) => Key;

  /**
   * Loading state.
   */
  loading?: boolean;

  /**
   * Message displayed when no records exist.
   */
  emptyMessage?: string;

  /**
   * Enable search.
   */
  searchable?: boolean;

  /**
   * Search input placeholder.
   */
  searchPlaceholder?: string;

  /**
   * Function used to determine which rows match a search.
   */
  searchFilter?: (row: T, query: string) => boolean;

  /**
   * Enable pagination.
   */
  pagination?: boolean;

  /**
   * Number of rows per page.
   */
  pageSize?: number;

  /**
   * Optional row click handler.
   */
  onRowClick?: (row: T) => void;

  /**
   * Additional CSS classes.
   */
  className?: string;
}
