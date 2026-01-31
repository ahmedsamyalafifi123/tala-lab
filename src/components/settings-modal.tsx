"use client";

import { useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Save,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Category } from "@/types";
import { useLabContext } from "@/contexts/LabContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoriesChange: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  categories,
  onCategoriesChange,
}: SettingsModalProps) {
  const { labId } = useLabContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit/Add state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Delete confirmation
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const supabase = createClient();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !labId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({ 
            name: newCategoryName.trim(),
            lab_id: labId
        });

      if (error) throw error;

      onCategoriesChange();
      setNewCategoryName("");
      setIsAddingNew(false);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("حدث خطأ أثناء الإضافة");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    if (!editName.trim() || editName === category.name) {
      setEditingId(null);
      return;
    }
    
    setIsSaving(true);
    try {
      const oldName = category.name;
      const newName = editName.trim();

      // Update category
      const { error: catError } = await supabase
        .from("categories")
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq("uuid", category.uuid);

      if (catError) throw catError;

      // Update clients? With array column distinct update is hard. 
      // We skip client update for now. 
      // TODO: Implement migration of category names in client records
      
      onCategoriesChange();
      setEditingId(null);
      setEditName("");
    } catch (error) {
      console.error("Error updating category:", error);
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setIsSaving(false);
    }
  };

  const prepareDelete = async (category: Category) => {
    // Check usage?
    // Complex with array check. 
    // supabase.from('clients').select(...).contains('categories', [category.name])
    
    setDeleteCategory(category);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    
    setIsDeleting(true);
    try {
      // Delete category
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("uuid", deleteCategory.uuid);

      if (error) throw error;

      onCategoriesChange();
      setDeleteCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.uuid);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] sm:h-[60vh] rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-xl">الإعدادات</SheetTitle>
            <SheetDescription>إدارة تصنيفات الحالات</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* Category List */}
            {categories.map((category) => (
              <div
                key={category.uuid}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {editingId === category.uuid ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateCategory(category);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdateCategory(category)}
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
                    <span className="flex-1 font-medium">{category.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => prepareDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {/* Add New Category */}
            {isAddingNew ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/50">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اسم التصنيف الجديد"
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") {
                      setIsAddingNew(false);
                      setNewCategoryName("");
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddCategory}
                  disabled={isSaving || !newCategoryName.trim()}
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
                    setNewCategoryName("");
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
                إضافة تصنيف جديد
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التصنيف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تصنيف <strong>{deleteCategory?.name}</strong>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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
