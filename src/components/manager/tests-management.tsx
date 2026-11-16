"use client";

import { useState } from "react";
import { useLabTestCatalog, type LabTestCatalogMode } from "@/hooks/use-lab-tests";
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLabTestCategories } from "@/hooks/use-lab-test-categories";
import type { LabTest } from "@/types/results";
import type { LabTestView } from "@/lib/lab-tests";
import { ReferenceRulesEditor } from "@/components/manager/reference-rules-editor";
import {
  asRules,
  formatRules,
  validateRules,
  type ReferenceRule,
} from "@/lib/reference-rules";

interface TestsManagementProps {
  /** 'manager' edits the shared catalogue; 'lab' edits one lab's catalogue. */
  mode: LabTestCatalogMode;
  labId?: string | null;
  /** Lab mode only: lab admins may edit. Others see the list read-only. */
  canEdit?: boolean;
}

const emptyForm = {
  test_code: "",
  test_name_ar: "",
  test_name_en: "",
  category: "",
  unit: "",
  display_order: "",
};

export function TestsManagement({ mode, labId = null, canEdit = true }: TestsManagementProps) {
  const {
    tests,
    hiddenTests,
    loading,
    isLab,
    createTest,
    updateTest,
    deleteTest,
    resetTest,
    reorderTests,
  } = useLabTestCatalog({ mode, labId });
  const { toast } = useToast();
  const { categories } = useLabTestCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTestView | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const [formData, setFormData] = useState(emptyForm);
  const [rules, setRules] = useState<ReferenceRule[]>([]);

  const writable = mode === "manager" || canEdit;

  const resetForm = () => {
    setFormData(emptyForm);
    setRules([]);
    setEditingTest(null);
  };

  const notifyError = (description: string) =>
    toast({ title: "خطأ", description, variant: "destructive" });

  // Move a test up or down: renumber the list sequentially and persist
  // only the rows whose display_order actually changed.
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tests.length || reordering) return;

    const reordered = [...tests];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    const updates = reordered
      .map((test, i) => ({ uuid: test.uuid, display_order: i }))
      .filter((u, i) => tests[i]?.display_order !== u.display_order || tests[i]?.uuid !== u.uuid);

    setReordering(true);
    const result = await reorderTests(updates);
    setReordering(false);

    if (result.error) notifyError(result.error);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (test: LabTestView) => {
    setEditingTest(test);
    setRules(asRules(test.reference_ranges));
    setFormData({
      test_code: test.test_code,
      test_name_ar: test.test_name_ar,
      test_name_en: test.test_name_en,
      category: test.category,
      unit: test.unit || "",
      display_order: test.display_order?.toString() ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.test_code || !formData.test_name_ar || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const ruleCheck = validateRules(rules);
    if (!ruleCheck.ok) {
      toast({
        title: "Invalid reference values",
        description: ruleCheck.errors.join(" — "),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // null (not undefined) clears the unit: undefined would be dropped from
      // the request, so a cleared unit would silently keep its old value.
      const testData = {
        test_code: formData.test_code.toUpperCase(),
        test_name_ar: formData.test_name_ar,
        test_name_en: formData.test_name_en || formData.test_name_ar,
        category: formData.category,
        unit: formData.unit.trim() || null,
        reference_ranges: rules,
        is_active: true,
        display_order: formData.display_order !== ""
          ? parseInt(formData.display_order, 10)
          : editingTest?.display_order ?? tests.length,
      };

      const result = editingTest
        ? await updateTest(editingTest.uuid, testData as Partial<LabTest>)
        : await createTest(testData as Parameters<typeof createTest>[0]);

      if (result.error) throw new Error(result.error);

      toast({
        title: editingTest ? "تم التعديل" : "تمت الإضافة",
        description: editingTest ? "تم تعديل التحليل بنجاح" : "تمت إضافة التحليل بنجاح",
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      notifyError(error instanceof Error ? error.message : "تعذر حفظ التحليل");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (uuid: string, action: () => Promise<{ error: string | null }>, success: { title: string; description: string }) => {
    setBusyUuid(uuid);
    const result = await action();
    setBusyUuid(null);
    if (result.error) {
      notifyError(result.error);
    } else {
      toast({ title: success.title, description: success.description });
    }
  };

  const handleDelete = (test: LabTestView) => {
    const hidesShared = isLab && test.source === "shared";
    const message = hidesShared
      ? `إخفاء التحليل "${test.test_name_ar}" من معملك؟ يمكنك استعادته لاحقاً.`
      : `هل أنت متأكد من حذف التحليل "${test.test_name_ar}"؟`;
    if (!confirm(message)) return;

    runAction(
      test.uuid,
      () => deleteTest(test.uuid),
      hidesShared
        ? { title: "تم الإخفاء", description: "تم إخفاء التحليل من معملك" }
        : { title: "تم الحذف", description: "تم حذف التحليل بنجاح" }
    );
  };

  const handleReset = (test: LabTestView) => {
    if (!confirm(`استعادة التحليل "${test.test_name_ar}" إلى الإعداد المشترك؟ سيتم تجاهل تعديلات معملك عليه.`)) {
      return;
    }
    runAction(test.uuid, () => resetTest(test.uuid), {
      title: "تمت الاستعادة",
      description: "تم استعادة التحليل إلى الإعداد المشترك",
    });
  };

  const handleRestoreHidden = (test: LabTestView) =>
    runAction(test.uuid, () => resetTest(test.uuid), {
      title: "تمت الاستعادة",
      description: "تم إظهار التحليل في معملك",
    });

  const categoryLabel = (value: string) =>
    categories.find((c) => c.value === value)?.label_ar || value;

  const sourceBadge = (test: LabTestView) => {
    if (!isLab) return null;
    if (test.source === "lab") {
      return { text: "خاص بالمعمل", className: "bg-primary/10 text-primary" };
    }
    if (test.overridden) {
      return { text: "معدّل لمعملك", className: "bg-amber-100 text-amber-800" };
    }
    return { text: "مشترك", className: "bg-muted text-muted-foreground" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const columnCount = isLab ? 9 : 8;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">
          إجمالي التحاليل: {tests.length}
        </p>
        {writable && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة تحليل
          </Button>
        )}
      </div>

      {isLab && !canEdit && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          للاطلاع فقط. تعديل التحاليل متاح لمسؤول المعمل.
        </p>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[90px]">الترتيب</TableHead>
              <TableHead className="hidden md:table-cell text-right">الكود</TableHead>
              <TableHead className="text-right">الاسم بالعربية</TableHead>
              <TableHead className="hidden lg:table-cell text-right">الاسم بالإنجليزية</TableHead>
              <TableHead className="hidden md:table-cell text-right">الفئة</TableHead>
              <TableHead className="hidden lg:table-cell text-right">الوحدة</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Reference values</TableHead>
              {isLab && <TableHead className="hidden md:table-cell text-right">المصدر</TableHead>}
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center py-8 text-muted-foreground">
                  لا توجد تحاليل. أضف تحليل جديد للبدء.
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test, index) => {
                const badge = sourceBadge(test);
                const busy = busyUuid === test.uuid;
                return (
                  <TableRow key={test.uuid}>
                    <TableCell className="text-right">
                      {writable && (
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === 0 || reordering}
                            onClick={() => handleMove(index, -1)}
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === tests.length - 1 || reordering}
                            onClick={() => handleMove(index, 1)}
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-right">{test.test_code}</TableCell>
                    <TableCell className="font-medium text-right">{test.test_name_ar}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-right">{test.test_name_en}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                        {categoryLabel(test.category)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">{test.unit || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {formatRules(asRules(test.reference_ranges))}
                    </TableCell>
                    {isLab && (
                      <TableCell className="hidden md:table-cell text-right">
                        {badge && (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.text}
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-start">
                        {writable && (
                          <>
                            {isLab && test.source === "shared" ? (
                              <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleDelete(test)} title="إخفاء من معملك">
                                <EyeOff className="h-4 w-4 text-destructive" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleDelete(test)} title="حذف">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            {isLab && test.overridden && (
                              <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleReset(test)} title="استعادة الإعداد المشترك">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleEdit(test)} title="تعديل">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isLab && hiddenTests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            تحاليل مخفية من معملك ({hiddenTests.length})
          </h4>
          <div className="space-y-2">
            {hiddenTests.map((test) => (
              <div key={test.uuid} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="flex-1 font-medium text-sm">{test.test_name_ar}</span>
                {writable && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyUuid === test.uuid}
                    onClick={() => handleRestoreHidden(test)}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    إظهار
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-3xl text-right max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto]"
          dir="rtl"
        >
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingTest ? "تعديل تحليل" : "إضافة تحليل جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingTest
                ? isLab && editingTest.source === "shared"
                  ? "هذا تحليل مشترك. التعديلات تسري على معملك فقط."
                  : "تعديل بيانات التحليل"
                : isLab
                  ? "أدخل بيانات التحليل الخاص بمعملك"
                  : "أدخل بيانات التحليل الجديد"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <ReferenceRulesEditor rules={rules} onChange={setRules} />

            <div className="space-y-2">
              <Label htmlFor="display_order">الترتيب</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
                placeholder="0"
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                الرقم الأصغر يظهر أولاً في قوائم المعامل
              </p>
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
