
import type { ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalPosition = "center" | "left" | "right";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}
