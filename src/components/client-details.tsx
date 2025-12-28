"use client";

import { useState } from "react";
import { Trash2, Pencil, Loader2 } from "lucide-react";
import { Client } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  const handleDelete = async () => {
    await onDelete(client);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] sm:h-[60vh] rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {client.daily_id}
                  </div>
                  <div>
                    <SheetTitle className="text-xl text-start">{client.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(client.client_date)}</p>
                  </div>
                </div>
                {client.category && (
                  <Badge variant={client.category === "صحة مدرسية" ? "default" : "secondary"}>
                    {client.category}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-4 space-y-6">
              {client.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">الملاحظات</h4>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        {client.notes}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">تم الإنشاء</p>
                    <p className="font-medium">{formatTime(client.created_at)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">آخر تحديث</p>
                    <p className="font-medium">{formatTime(client.updated_at)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="flex gap-3 w-full">
                <Button
                  variant="destructive"
                  className="flex-1 h-12 text-lg"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-5 h-5 me-2" />
                  حذف
                </Button>
                <Button
                  className="flex-1 h-12 text-lg"
                  onClick={() => {
                    onClose();
                    onEdit(client);
                  }}
                >
                  <Pencil className="w-5 h-5 me-2" />
                  تعديل
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حالة <strong>{client.name}</strong>؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحذف...
                </span>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
