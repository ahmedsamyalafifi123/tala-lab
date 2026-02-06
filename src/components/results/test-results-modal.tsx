"use client";

import { useState, useEffect } from "react";
import { useLabTests } from "@/hooks/use-lab-tests";
import { useClientResults } from "@/hooks/use-client-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check, AlertCircle, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateFlag, formatReferenceRange, validateTestValue, getFlagColor, getFlagIcon, groupTestsByCategory } from "@/lib/test-utils";
import type { TestResult } from "@/types/results";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientUuid: string;
  clientName: string;
  clientGender?: "male" | "female";
  clientAge?: number;
}

export function TestResultsModal({
  isOpen,
  onClose,
  clientUuid,
  clientName,
  clientGender,
  clientAge,
}: TestResultsModalProps) {
  const { toast } = useToast();
  const { tests, loading: testsLoading } = useLabTests();
  const { selectedTests, results, addResultEntry, updateResultEntry, loading: resultsLoading } = useClientResults(clientUuid);
  const [saving, setSaving] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, { value: string; notes?: string }>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"history" | "add">("history"); // Default to showing history
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track which entry is being edited

  // Get current user
  useEffect(() => {
    const getUserId = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getUserId();
  }, []);

  // Filter tests based on selected_tests
  const availableTests = tests.filter((test) =>
    selectedTests.includes(test.test_code)
  );

  const groupedTests = groupTestsByCategory(availableTests);

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setTestValues({});
      setOverallNotes("");
      setViewMode("history");
      setEditingEntryId(null);
    } else {
      // Show add form if no results, otherwise show history
      if (results.entries && results.entries.length > 0) {
        setViewMode("history");
      } else {
        setViewMode("add");
      }
    }
  }, [isOpen, results.entries]);

  const handleValueChange = (testCode: string, value: string) => {
    setTestValues((prev) => ({
      ...prev,
      [testCode]: { ...prev[testCode], value },
    }));
  };

  const handleNotesChange = (testCode: string, notes: string) => {
    setTestValues((prev) => ({
      ...prev,
      [testCode]: { ...prev[testCode], notes },
    }));
  };

  const getTestFlag = (testCode: string, value: string) => {
    const test = tests.find((t) => t.test_code === testCode);
    if (!test || !value) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    return calculateFlag(numValue, test.reference_ranges, clientGender, clientAge);
  };

  const handleSubmit = async () => {
    // Validate at least one test has a value
    const filledTests = Object.entries(testValues).filter(([_, data]) => data.value && data.value.trim());

    if (filledTests.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال قيمة لتحليل واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    // Validate all values
    for (const [testCode, data] of filledTests) {
      const test = tests.find((t) => t.test_code === testCode);
      if (test) {
        const validation = validateTestValue(data.value, test);
        if (!validation.isValid) {
          toast({
            title: "خطأ في القيمة",
            description: `${test.test_name_ar}: ${validation.error}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(true);

    try {
      // Build test results with flags
      const testResults: Record<string, TestResult> = {};
      filledTests.forEach(([testCode, data]) => {
        const test = tests.find((t) => t.test_code === testCode);
        if (test) {
          const numValue = parseFloat(data.value);
          testResults[testCode] = {
            value: numValue,
            unit: test.unit,
            flag: getTestFlag(testCode, data.value) || undefined,
            notes: data.notes,
          };
        }
      });

      let result;

      if (editingEntryId) {
        // Update existing entry
        result = await updateResultEntry(editingEntryId, testResults, overallNotes);
      } else {
        // Add new entry
        result = await addResultEntry(testResults, overallNotes, currentUserId);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "تم الحفظ",
        description: editingEntryId ? "تم تحديث النتائج بنجاح" : "تم حفظ نتائج التحاليل بنجاح",
      });

      // Switch to history view to show the saved results
      setViewMode("history");
      setTestValues({});
      setOverallNotes("");
      setEditingEntryId(null);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (testsLoading || resultsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>جاري التحميل...</DialogTitle>
            <DialogDescription>يرجى الانتظار</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (availableTests.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>لا توجد تحاليل</DialogTitle>
            <DialogDescription>
              لم يتم تحديد أي تحاليل لهذا العميل. يرجى تعديل الحالة وإضافة التحاليل المطلوبة.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewMode === "history"
              ? "نتائج التحاليل"
              : editingEntryId
                ? "تعديل النتائج"
                : "إضافة نتائج التحاليل"} - {clientName}
          </DialogTitle>
          <DialogDescription>
            {viewMode === "history"
              ? "سجل نتائج التحاليل السابقة. اضغط تعديل للتغيير."
              : "أدخل نتائج التحاليل المطلوبة. سيتم حساب الحالة (طبيعي/مرتفع/منخفض) تلقائياً."
            }
          </DialogDescription>
        </DialogHeader>

        {/* View mode indicator - only show when editing */}
        {viewMode === "add" && (
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("history");
                setEditingEntryId(null);
                setTestValues({});
                setOverallNotes("");
              }}
              size="sm"
            >
              ← رجوع للسجل
            </Button>
          </div>
        )}

        {/* History View */}
        {viewMode === "history" && results.entries && results.entries.length > 0 && (
          <div className="space-y-4 py-4">
            <div className="space-y-4">
                {results.entries.map((entry) => (
                  <div key={entry.entry_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.recorded_at).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Load entry data into form
                          const values: Record<string, { value: string; notes?: string }> = {};
                          Object.entries(entry.tests).forEach(([testCode, result]) => {
                            values[testCode] = {
                              value: result.value.toString(),
                              notes: result.notes,
                            };
                          });
                          setTestValues(values);
                          setOverallNotes(entry.notes || "");
                          setEditingEntryId(entry.entry_id);
                          setViewMode("add");
                        }}
                      >
                        <Pencil className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Show all selected tests, even if not filled yet */}
                      {selectedTests.map((testCode) => {
                        const test = tests.find((t) => t.test_code === testCode);
                        const result = entry.tests[testCode];
                        const flagColor = result?.flag ? getFlagColor(result.flag) : "";
                        const flagIcon = result?.flag ? getFlagIcon(result.flag) : null;

                        return (
                          <div
                            key={testCode}
                            className={`border rounded p-2 ${!result ? 'bg-muted/30 border-dashed' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">{test?.test_name_ar || testCode}</p>
                                {result ? (
                                  <p className="font-semibold">
                                    {result.value} {result.unit}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    لم يتم إضافتها
                                  </p>
                                )}
                              </div>
                              {flagIcon && (
                                <span className={`text-lg font-bold ${flagColor}`}>
                                  {flagIcon}
                                </span>
                              )}
                            </div>
                            {result?.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{result.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {entry.notes && (
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>ملاحظات:</strong> {entry.notes}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Add New Entry View */}
        {viewMode === "add" && (
          <div className="space-y-4 py-4">
            <Accordion type="multiple" className="w-full">
            {Object.entries(groupedTests).map(([category, categoryTests]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-sm font-medium">
                  {category} ({categoryTests.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pr-4">
                    {categoryTests.map((test) => {
                      const value = testValues[test.test_code]?.value || "";
                      const flag = getTestFlag(test.test_code, value);
                      const refRange = formatReferenceRange(test.reference_ranges, clientGender, clientAge);

                      return (
                        <div key={test.test_code} className="space-y-2 border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Label htmlFor={test.test_code} className="font-medium">
                                {test.test_name_ar}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                القيم الطبيعية: {refRange} {test.unit}
                              </p>
                            </div>
                            {flag && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getFlagColor(flag)}`}>
                                <span>{getFlagIcon(flag)}</span>
                                <span>{flag === 'normal' ? 'طبيعي' : flag === 'high' ? 'مرتفع' : flag === 'low' ? 'منخفض' : flag === 'critical_high' ? 'مرتفع جداً' : 'منخفض جداً'}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor={test.test_code} className="text-xs">
                                القيمة {test.unit && `(${test.unit})`}
                              </Label>
                              <Input
                                id={test.test_code}
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(e) => handleValueChange(test.test_code, e.target.value)}
                                placeholder="أدخل القيمة"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`${test.test_code}-notes`} className="text-xs">
                                ملاحظات (اختياري)
                              </Label>
                              <Input
                                id={`${test.test_code}-notes`}
                                value={testValues[test.test_code]?.notes || ""}
                                onChange={(e) => handleNotesChange(test.test_code, e.target.value)}
                                placeholder="ملاحظات"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="overall-notes">ملاحظات عامة (اختياري)</Label>
            <Textarea
              id="overall-notes"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="أي ملاحظات عامة على الفحص..."
              rows={3}
            />
          </div>
          </div>
        )}

        <DialogFooter>
          {viewMode === "add" ? (
            <>
              <Button variant="outline" onClick={() => setViewMode("history")} disabled={saving}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingEntryId ? "تحديث النتائج" : "حفظ النتائج"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
