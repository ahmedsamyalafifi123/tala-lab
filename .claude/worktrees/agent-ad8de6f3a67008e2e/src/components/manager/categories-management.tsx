"use client";

import { useState } from "react";
import { useLabTestCategories } from "@/hooks/use-lab-test-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LabTestCategory } from "@/types/results";

export function CategoriesManagement() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } =
    useLabTestCategories();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LabTestCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    value: "",
    label_ar: "",
    label_en: "",
    display_order: "",
  });

  const resetForm = () => {
    setFormData({ value: "", label_ar: "", label_en: "", display_order: "" });
    setEditingCategory(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (cat: LabTestCategory) => {
    setEditingCategory(cat);
    setFormData({
      value: cat.value,
      label_ar: cat.label_ar,
      label_en: cat.label_en,
      display_order: cat.display_order.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.value || !formData.label_ar || !formData.label_en) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        value: formData.value,
        label_ar: formData.label_ar,
        label_en: formData.label_en,
        display_order: formData.display_order
          ? parseInt(formData.display_order, 10)
          : categories.length + 1,
        is_active: true,
      };

      const result = editingCategory
        ? await updateCategory(editingCategory.uuid, payload)
        : await createCategory(payload);

      if (result.error) throw new Error(result.error);

      toast({
        title: editingCategory ? "تم التعديل" : "تمت الإضافة",
        description: editingCategory ? "تم تعديل الفئة بنجاح" : "تمت إضافة الفئة بنجاح",
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: LabTestCategory) => {
    if (!confirm(`هل أنت متأكد من حذف الفئة "${cat.label_ar}"؟`)) return;

    const result = await deleteCategory(cat.uuid);
    if (result.error) {
      toast({ title: "خطأ", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          إجمالي الفئات: {categories.length}
        </p>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة فئة
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الترتيب</TableHead>
              <TableHead className="text-right">المفتاح (value)</TableHead>
              <TableHead className="text-right">الاسم بالعربية</TableHead>
              <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد فئات. أضف فئة جديدة للبدء.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.uuid}>
                  <TableCell className="text-right">{cat.display_order}</TableCell>
                  <TableCell className="font-mono text-xs text-right">{cat.value}</TableCell>
                  <TableCell className="font-medium text-right">{cat.label_ar}</TableCell>
                  <TableCell className="text-muted-foreground text-right">{cat.label_en}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-start">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cat)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "تعديل بيانات الفئة" : "أدخل بيانات الفئة الجديدة"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">المفتاح (بالإنجليزية) *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Hematology"
                disabled={!!editingCategory}
                className="font-mono text-right"
              />
              <p className="text-xs text-muted-foreground">
                يُستخدم داخلياً لربط التحاليل بالفئة. لا يمكن تغييره بعد الإنشاء.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label_ar">الاسم بالعربية *</Label>
                <Input
                  id="label_ar"
                  value={formData.label_ar}
                  onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                  placeholder="أمراض الدم"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label_en">الاسم بالإنجليزية *</Label>
                <Input
                  id="label_en"
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  placeholder="Hematology"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">الترتيب</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                placeholder={String(categories.length + 1)}
                className="text-right"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "حفظ التعديلات" : "إضافة الفئة"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
