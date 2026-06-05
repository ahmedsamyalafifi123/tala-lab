import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title || "خطأ", {
        description,
      });
    } else {
      sonnerToast.success(title || "نجح", {
        description,
      });
    }
  };

  return { toast };
}

export { sonnerToast as toast };
