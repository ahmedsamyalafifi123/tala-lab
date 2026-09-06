"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useClinics } from "@/hooks/use-clinics";
import type { Clinic } from "@/types";

/**
 * Add / edit / delete the lab's referring clinics.
 *
 * Deleting is a soft delete: clients that already reference the clinic keep
 * showing its name on their reports, it simply stops being offered for new
 * ones.
 */
export function ClinicsManagement() {
  const {
    clinics,
    loading,
    error,
    createClinic,
    updateClinic,
    deleteClinic,
  } = useClinics();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Clinic | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    setIsSaving(true);
    const { error: addError } = await createClinic(name);
    setIsSaving(false);

    if (addError) {
      alert(
        addError.includes("duplicate")
          ? "يوجد عيادة بنفس الاسم"
          : "حدث خطأ أثناء الإضافة"
      );
      return;
    }

    setNewName("");
    setIsAddingNew(false);
  };

  const handleUpdate = async (clinic: Clinic) => {
    const name = editName.trim();
    if (!name || name === clinic.name) {
      setEditingId(null);
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await updateClinic(clinic.uuid, name);
    setIsSaving(false);

    if (updateError) {
      alert(
        updateError.includes("duplicate")
          ? "يوجد عيادة بنفس الاسم"
          : "حدث خطأ أثناء التحديث"
      );
      return;
    }

    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    const { error: deleteError } = await deleteClinic(pendingDelete.uuid);
    setIsDeleting(false);

    if (deleteError) {
      alert("حدث خطأ أثناء الحذف");
      return;
    }

    setPendingDelete(null);
  };

  const startEdit = (clinic: Clinic) => {
    setEditingId(clinic.uuid);
    setEditName(clinic.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {clinics.length === 0 && !isAddingNew && (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
            لا توجد عيادات بعد
          </p>
        )}

        {clinics.map((clinic) => (
          <div
            key={clinic.uuid}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            {editingId === clinic.uuid ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(clinic);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleUpdate(clinic)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{clinic.name}</span>
                <Button size="icon" variant="ghost" onClick={() => startEdit(clinic)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPendingDelete(clinic)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}

        {isAddingNew ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/50">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم العيادة الجديدة"
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAddingNew(false);
                  setNewName("");
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAdd}
              disabled={isSaving || !newName.trim()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsAddingNew(false);
                setNewName("");
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="h-4 w-4 me-2" />
            إضافة عيادة جديدة
          </Button>
        )}
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={() => setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العيادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف عيادة <strong>{pendingDelete?.name}</strong>؟
              الحالات المسجلة عليها ستظل تعرض اسمها في التقارير.
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
