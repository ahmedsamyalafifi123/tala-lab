"use client";

import { useState } from "react";
import { useTestGroups } from "@/hooks/use-test-groups";
import { useLabTests } from "@/hooks/use-lab-tests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { groupTestsByCategory } from "@/lib/test-utils";
import type { TestGroup } from "@/types/results";

export function TestGroupsManagement() {
  const { groups, loading, createGroup, updateGroup, deleteGroup } = useTestGroups();
  const { tests, loading: testsLoading } = useLabTests();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TestGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    group_code: "",
    group_name_ar: "",
    group_name_en: "",
    test_codes: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      group_code: "",
      group_name_ar: "",
      group_name_en: "",
      test_codes: [],
    });
    setEditingGroup(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (group: TestGroup) => {
    setEditingGroup(group);
    setFormData({
      group_code: group.group_code,
      group_name_ar: group.group_name_ar,
      group_name_en: group.group_name_en,
      test_codes: group.test_codes,
    });
    setIsDialogOpen(true);
  };

  const handleTestToggle = (testCode: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      test_codes: checked
        ? [...prev.test_codes, testCode]
        : prev.test_codes.filter((code) => code !== testCode),
    }));
  };

  const handleSelectAllCategory = (categoryTests: any[], selectAll: boolean) => {
    const categoryCodes = categoryTests.map((test) => test.test_code);
    setFormData((prev) => ({
      ...prev,
      test_codes: selectAll
        ? [...new Set([...prev.test_codes, ...categoryCodes])]
        : prev.test_codes.filter((code) => !categoryCodes.includes(code)),
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.group_code || !formData.group_name_ar || formData.test_codes.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة واختيار تحليل واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const groupData: any = {
        group_code: formData.group_code.toUpperCase(),
        group_name_ar: formData.group_name_ar,
        group_name_en: formData.group_name_en || formData.group_name_ar,
        test_codes: formData.test_codes,
        is_predefined: false,
        is_active: true,
        display_order: editingGroup?.display_order || groups.length,
      };

      let result;
      if (editingGroup) {
        result = await updateGroup(editingGroup.uuid, groupData);
      } else {
        result = await createGroup(groupData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: editingGroup ? "تم التعديل" : "تمت الإضافة",
        description: editingGroup
          ? "تم تعديل المجموعة بنجاح"
          : "تمت إضافة المجموعة بنجاح",
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

  const handleDelete = async (group: TestGroup) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${group.group_name_ar}"؟`)) {
      return;
    }

    const result = await deleteGroup(group.uuid);

    if (result.error) {
      toast({
        title: "خطأ",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف المجموعة بنجاح",
      });
    }
  };

  const groupedTests = groupTestsByCategory(tests);

  if (loading || testsLoading) {
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
          إجمالي المجموعات: {groups.length}
        </p>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مجموعة
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الكود</TableHead>
              <TableHead className="text-right">الاسم بالعربية</TableHead>
              <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
              <TableHead className="text-right">عدد التحاليل</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد مجموعات. أضف مجموعة جديدة للبدء.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.uuid}>
                  <TableCell className="font-mono text-xs text-right">{group.group_code}</TableCell>
                  <TableCell className="font-medium text-right">{group.group_name_ar}</TableCell>
                  <TableCell className="text-muted-foreground text-right">{group.group_name_en}</TableCell>
                  <TableCell className="text-right">{group.test_codes.length} تحليل</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(group)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingGroup ? "تعديل مجموعة" : "إضافة مجموعة جديدة"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "تعديل بيانات المجموعة واختيار التحاليل"
                : "أدخل بيانات المجموعة واختر التحاليل"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group_code">كود المجموعة *</Label>
                <Input
                  id="group_code"
                  value={formData.group_code}
                  onChange={(e) =>
                    setFormData({ ...formData, group_code: e.target.value })
                  }
                  placeholder="ROUTINE_PANEL"
                  disabled={!!editingGroup}
                  className="font-mono text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_name_ar">الاسم بالعربية *</Label>
                <Input
                  id="group_name_ar"
                  value={formData.group_name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, group_name_ar: e.target.value })
                  }
                  placeholder="الفحص الروتيني"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_name_en">الاسم بالإنجليزية</Label>
              <Input
                id="group_name_en"
                value={formData.group_name_en}
                onChange={(e) =>
                  setFormData({ ...formData, group_name_en: e.target.value })
                }
                placeholder="Routine Panel"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label>التحاليل المتضمنة * ({formData.test_codes.length} محدد)</Label>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <Accordion type="multiple" className="w-full" dir="rtl">
                  {Object.entries(groupedTests).map(([category, categoryTests]) => {
                    const allSelected = categoryTests.every((test) =>
                      formData.test_codes.includes(test.test_code)
                    );
                    return (
                    <AccordionItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <AccordionTrigger className="text-sm font-medium text-right flex-1">
                          {category} ({categoryTests.length})
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllCategory(categoryTests, !allSelected);
                          }}
                        >
                          {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                        </Button>
                      </div>
                      <AccordionContent>
                        <div className="space-y-2 pe-4">
                          {categoryTests.map((test) => (
                            <div key={test.test_code} className="flex items-center gap-2">
                              <Checkbox
                                id={test.test_code}
                                checked={formData.test_codes.includes(test.test_code)}
                                onCheckedChange={(checked) =>
                                  handleTestToggle(test.test_code, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={test.test_code}
                                className="text-sm cursor-pointer flex-1 text-right"
                              >
                                {test.test_name_ar}
                                <span className="text-muted-foreground me-2">
                                  ({test.test_code})
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGroup ? "حفظ التعديلات" : "إضافة المجموعة"}
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
