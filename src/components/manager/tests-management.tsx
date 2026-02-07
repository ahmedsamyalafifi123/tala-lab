"use client";

import { useState } from "react";
import { useLabTests } from "@/hooks/use-lab-tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LabTest } from "@/types/results";

const TEST_CATEGORIES = [
  { value: "Hematology", label: "أمراض الدم" },
  { value: "Diabetes", label: "السكري" },
  { value: "Lipid Profile", label: "الدهون" },
  { value: "Liver Function", label: "وظائف الكبد" },
  { value: "Kidney Function", label: "وظائف الكلى" },
  { value: "Thyroid Function", label: "الغدة الدرقية" },
  { value: "Electrolytes", label: "الأملاح والمعادن" },
  { value: "Immunology", label: "المناعة" },
  { value: "Hormones", label: "الهرمونات" },
  { value: "Vitamins", label: "الفيتامينات" },
  { value: "Tumor Markers", label: "دلالات الأورام" },
  { value: "Serology", label: "الأمصال" },
  { value: "Urine Analysis", label: "تحليل البول" },
  { value: "Stool Analysis", label: "تحليل البراز" },
  { value: "Other", label: "أخرى" },
];

export function TestsManagement() {
  const { tests, loading, createTest, updateTest, deleteTest } = useLabTests();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    test_code: "",
    test_name_ar: "",
    test_name_en: "",
    category: "",
    unit: "",
    reference_min: "",
    reference_max: "",
  });

  const resetForm = () => {
    setFormData({
      test_code: "",
      test_name_ar: "",
      test_name_en: "",
      category: "",
      unit: "",
      reference_min: "",
      reference_max: "",
    });
    setEditingTest(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (test: LabTest) => {
    setEditingTest(test);
    const defaultRange = test.reference_ranges.default;
    setFormData({
      test_code: test.test_code,
      test_name_ar: test.test_name_ar,
      test_name_en: test.test_name_en,
      category: test.category,
      unit: test.unit || "",
      reference_min: defaultRange?.min.toString() || "",
      reference_max: defaultRange?.max.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.test_code || !formData.test_name_ar || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const testData: any = {
        test_code: formData.test_code.toUpperCase(),
        test_name_ar: formData.test_name_ar,
        test_name_en: formData.test_name_en || formData.test_name_ar,
        category: formData.category,
        unit: formData.unit || undefined,
        reference_ranges: {
          default: formData.reference_min && formData.reference_max
            ? {
                min: parseFloat(formData.reference_min),
                max: parseFloat(formData.reference_max),
              }
            : {},
        },
        is_active: true,
        display_order: editingTest?.display_order || tests.length,
      };

      let result;
      if (editingTest) {
        result = await updateTest(editingTest.uuid, testData);
      } else {
        result = await createTest(testData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: editingTest ? "تم التعديل" : "تمت الإضافة",
        description: editingTest
          ? "تم تعديل التحليل بنجاح"
          : "تمت إضافة التحليل بنجاح",
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: LabTest) => {
    if (!confirm(`هل أنت متأكد من حذف التحليل "${test.test_name_ar}"؟`)) {
      return;
    }

    const result = await deleteTest(test.uuid);

    if (result.error) {
      toast({
        title: "خطأ",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف التحليل بنجاح",
      });
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
          إجمالي التحاليل: {tests.length}
        </p>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة تحليل
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الكود</TableHead>
              <TableHead className="text-right">الاسم بالعربية</TableHead>
              <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">الوحدة</TableHead>
              <TableHead className="text-right">القيم الطبيعية</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد تحاليل. أضف تحليل جديد للبدء.
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.uuid}>
                  <TableCell className="font-mono text-xs text-right">{test.test_code}</TableCell>
                  <TableCell className="font-medium text-right">{test.test_name_ar}</TableCell>
                  <TableCell className="text-muted-foreground text-right">{test.test_name_en}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {TEST_CATEGORIES.find(c => c.value === test.category)?.label || test.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{test.unit || "-"}</TableCell>
                  <TableCell className="text-right">
                    {test.reference_ranges.default
                      ? `${test.reference_ranges.default.min} - ${test.reference_ranges.default.max}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(test)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(test)}
                      >
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingTest ? "تعديل تحليل" : "إضافة تحليل جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingTest
                ? "تعديل بيانات التحليل"
                : "أدخل بيانات التحليل الجديد"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_code">كود التحليل *</Label>
                <Input
                  id="test_code"
                  value={formData.test_code}
                  onChange={(e) =>
                    setFormData({ ...formData, test_code: e.target.value })
                  }
                  placeholder="CBC_WBC"
                  disabled={!!editingTest}
                  className="font-mono text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_name_ar">الاسم بالعربية *</Label>
                <Input
                  id="test_name_ar"
                  value={formData.test_name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, test_name_ar: e.target.value })
                  }
                  placeholder="عدد خلايا الدم البيضاء"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_name_en">الاسم بالإنجليزية</Label>
                <Input
                  id="test_name_en"
                  value={formData.test_name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, test_name_en: e.target.value })
                  }
                  placeholder="White Blood Cells"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="mg/dL, ×10³/µL, %, etc."
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference_min">الحد الأدنى للقيم الطبيعية</Label>
                <Input
                  id="reference_min"
                  type="number"
                  step="0.01"
                  value={formData.reference_min}
                  onChange={(e) =>
                    setFormData({ ...formData, reference_min: e.target.value })
                  }
                  placeholder="70"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_max">الحد الأقصى للقيم الطبيعية</Label>
                <Input
                  id="reference_max"
                  type="number"
                  step="0.01"
                  value={formData.reference_max}
                  onChange={(e) =>
                    setFormData({ ...formData, reference_max: e.target.value })
                  }
                  placeholder="100"
                  className="text-right"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTest ? "حفظ التعديلات" : "إضافة التحليل"}
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
