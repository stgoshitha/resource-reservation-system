export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;

  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  pageSizeOptions?: number[];
  siblingCount?: number;

  showPageSize?: boolean;
  showInfo?: boolean;

  disabled?: boolean;
  className?: string;
}
