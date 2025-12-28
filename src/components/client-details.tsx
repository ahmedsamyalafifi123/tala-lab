"use client";

import { Client } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ClientDetailsProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => Promise<void>;
  isDeleting?: boolean;
}

export function ClientDetails({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: ClientDetailsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!client) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;

    const isHealth = category === "صحة مدرسية";
    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-medium text-white ${
          isHealth ? "badge-health" : "badge-cbc"
        }`}
      >
        {category}
      </span>
    );
  };

  const handleDelete = async () => {
    await onDelete(client);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl glass border-0 p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center text-white font-bold text-xl">
                    {client.daily_id}
                  </div>
                  <div>
                    <SheetTitle className="text-xl text-start">{client.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(client.client_date)}</p>
                  </div>
                </div>
                {getCategoryBadge(client.category)}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {client.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">الملاحظات</h4>
                  <div className="p-4 bg-secondary/30 rounded-xl">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {client.notes}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">تم الإنشاء</p>
                  <p className="font-medium">{formatTime(client.created_at)}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">آخر تحديث</p>
                  <p className="font-medium">{formatTime(client.updated_at)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50">
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 py-6 text-lg rounded-xl"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  حذف
                </Button>
                <Button
                  className="flex-1 py-6 text-lg gradient-btn border-0 rounded-xl text-white"
                  onClick={() => {
                    onClose();
                    onEdit(client);
                  }}
                >
                  <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  تعديل
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="glass border-0 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-base pt-2">
              هل أنت متأكد من حذف حالة <strong>{client.name}</strong>؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1 py-5 rounded-xl"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="flex-1 py-5 rounded-xl"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
