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
import { Loader2, Check, AlertCircle, Pencil, Beaker, Calendar, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateFlag, formatReferenceRange, validateTestValue, getFlagColor, getFlagIcon, getFlagLabel, groupTestsByCategory } from "@/lib/test-utils";
import type { TestResult } from "@/types/results";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
            description: `${test.test_name_en || test.test_name_ar}: ${validation.error}`,
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
          <div className="flex justify-center items-center py-12">
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden" aria-describedby="dialog-description">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div>
               <DialogTitle className="text-xl">
                 {viewMode === "history"
                   ? "نتائج التحاليل"
                   : editingEntryId
                     ? "تعديل النتائج"
                     : "إضافة نتائج التحاليل"}
               </DialogTitle>
               <DialogDescription id="dialog-description" className="mt-1">
                 {clientName} • {clientGender === 'male' ? 'ذكر' : 'أنثى'} • {clientAge} سنة
               </DialogDescription>
            </div>
            
            {viewMode === "history" && (
                <Button onClick={() => {
                  setViewMode("add");
                  setTestValues({});
                  setOverallNotes("");
                  setEditingEntryId(null);
                }}>
                  + إضافة نتائج جديدة
                </Button>
            )}
            
            {viewMode === "add" && (editingEntryId || (results.entries && results.entries.length > 0)) && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="gap-1 opacity-70 hover:opacity-100"
                 onClick={() => {
                   setViewMode("history");
                   setEditingEntryId(null);
                   setTestValues({});
                   setOverallNotes("");
                 }}
               >
                 <ArrowRight className="h-4 w-4" />
                 رجوع للسجل
               </Button>
             )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 text-right" dir="rtl">
        {/* History View */}
        {viewMode === "history" && results.entries && results.entries.length > 0 && (
          <div className="space-y-6 relative">
             <div className="absolute right-[19px] top-4 bottom-4 w-0.5 bg-border -z-10 hidden md:block" />
             
            {results.entries.map((entry, index) => {
               // Group tests for display
               const entryTests = Object.entries(entry.tests).map(([code, result]) => {
                  const test = tests.find(t => t.test_code === code);
                  return { code, result, test };
               });
               
               const groupedEntryTests: Record<string, typeof entryTests> = {};
               entryTests.forEach(item => {
                  const category = item.test?.category || "عام";
                  if (!groupedEntryTests[category]) groupedEntryTests[category] = [];
                  groupedEntryTests[category].push(item);
               });

               const isLatest = index === 0;

               return (
                  <div key={entry.entry_id} className="relative group">
                    <div className="flex items-start gap-4">
                       {/* Timeline dot */}
                       <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-background z-10 hidden md:flex",
                          isLatest ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                       )}>
                          <Calendar className="h-4 w-4" />
                       </div>

                       <div className={cn(
                          "flex-1 border rounded-xl overflow-hidden bg-card transition-all duration-200",
                          isLatest ? "border-primary/50 shadow-md" : "hover:border-primary/30"
                       )}>
                         <div className="bg-muted/30 border-b p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                     <h3 className="font-semibold text-base">
                                        {format(new Date(entry.recorded_at), "PPP", { locale: ar })}
                                     </h3>
                                     {isLatest && <Badge className="text-[10px] h-5 px-1.5">الأحدث</Badge>}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                     <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(entry.recorded_at), "p", { locale: ar })}
                                     </span>
                                     <span>•</span>
                                     <span>{Object.keys(entry.tests).length} تحليل</span>
                                  </div>
                               </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-muted-foreground hover:text-primary"
                              onClick={() => {
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
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="text-xs">تعديل</span>
                            </Button>
                         </div>
                         
                         <div className="divide-y">
                           {Object.entries(groupedEntryTests).map(([category, items]) => (
                              <div key={category} className="p-4">
                                 <div className="flex items-center gap-2 mb-3">
                                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                                       <Beaker className="h-3.5 w-3.5" />
                                    </div>
                                    <h4 className="font-medium text-sm text-foreground/80">{category}</h4>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {items.map(({ code, result, test }) => {
                                       const flagColor = result?.flag ? getFlagColor(result.flag) : "";
                                       const flagIcon = result?.flag ? getFlagIcon(result.flag) : null;
                                       
                                       return (
                                          <div key={code} className={cn(
                                             "border rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden",
                                             result.flag ? "bg-accent/20 border-accent/20" : "bg-card hover:bg-muted/20"
                                          )}>
                                             {result.flag && (
                                                <div className={cn("absolute top-0 right-0 w-1 h-full", flagColor.replace('text-', 'bg-').replace('bg-', ''))} />
                                             )}
                                             
                                             <div className="flex justify-between items-start gap-2">
                                                <span className="text-xs font-medium text-muted-foreground line-clamp-1 text-left" dir="ltr" title={test?.test_name_en || test?.test_name_ar}>{test?.test_name_en || test?.test_name_ar || code}</span>
                                                {flagIcon && <span className={cn("text-xs font-bold", flagColor)}>{flagIcon}</span>}
                                             </div>
                                             
                                             <div className="flex items-baseline gap-1 mt-auto">
                                                <span className="text-lg font-bold font-mono tracking-tight">{result.value}</span>
                                                <span className="text-xs text-muted-foreground">{result.unit || test?.unit || "-"}</span>
                                             </div>
                                             
                                             {result.notes && (
                                                <div className="text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded mt-1 truncate">
                                                   {result.notes}
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                         </div>
                         
                         {entry.notes && (
                            <div className="bg-muted/30 p-3 text-sm text-muted-foreground border-t flex gap-2">
                               <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                               <p>{entry.notes}</p>
                            </div>
                         )}
                       </div>
                    </div>
                  </div>
               );
            })}
          </div>
        )}

        {/* Add New Entry View */}
        {viewMode === "add" && (
          <div className="space-y-6 max-w-3xl mx-auto">
             <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
                   <Beaker className="h-4 w-4" />
                   إدخال نتائج التحاليل
                </h3>
                <p className="text-sm text-muted-foreground">
                   يرجى إدخال النتائج بدقة. سيتم تحديد الحالة (طبيعي/مرتفع/منخفض) تلقائياً بناءً على القيم المرجعية.
                </p>
             </div>
             
             <div className="space-y-8">
               {Object.entries(groupedTests).map(([category, categoryTests]) => (
                  <div key={category} className="space-y-4">
                     <div className="flex items-center gap-2 pb-2 border-b">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                           {category.charAt(0)}
                        </div>
                        <h4 className="font-semibold text-lg">{category}</h4>
                        <Badge variant="outline" className="mr-auto">{categoryTests.length} تحليل</Badge>
                     </div>
                     
                     <div className="grid gap-6">
                        {categoryTests.map((test) => {
                           const value = testValues[test.test_code]?.value || "";
                           const flag = getTestFlag(test.test_code, value);
                           const refRange = formatReferenceRange(test.reference_ranges, clientGender, clientAge);
                           
                           return (
                              <div key={test.test_code} className={cn(
                                 "group p-4 rounded-xl border transition-all duration-200",
                                 value ? (flag ? "bg-accent/5 border-accent/20 shadow-sm" : "bg-card border-border shadow-sm") : "bg-muted/10 border-transparent hover:border-border"
                              )}>
                                 <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                                    <div className="flex-1 space-y-1">
                                       <div className="flex items-center justify-between">
                                          <Label htmlFor={test.test_code} className="font-semibold text-base text-left block" dir="ltr">
                                             {test.test_name_en || test.test_name_ar}
                                          </Label>
                                          {test.unit && <Badge variant="secondary" className="text-xs font-mono">{test.unit}</Badge>}
                                       </div>
                                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>المدى الطبيعي:</span>
                                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{refRange}</span>
                                       </div>
                                    </div>
                                    
                                    <div className="flex-1 sm:max-w-[200px] space-y-2">
                                       <div className="relative">
                                          <Input
                                             id={test.test_code}
                                             type="number"
                                             step="0.01"
                                             value={value}
                                             onChange={(e) => handleValueChange(test.test_code, e.target.value)}
                                             placeholder="النتيجة"
                                             className={cn(
                                                "font-mono text-lg h-10 transition-colors",
                                                flag ? getFlagColor(flag).replace('text-', 'border-').replace('700', '300') : ""
                                             )}
                                             dir="ltr"
                                          />
                                          {flag && (
                                             <div className={cn(
                                                "absolute inset-y-0 right-3 flex items-center pointer-events-none",
                                                getFlagColor(flag)
                                             )}>
                                                {getFlagIcon(flag)}
                                             </div>
                                          )}
                                       </div>
                                       {flag && (
                                          <div className={cn("text-xs font-medium flex items-center justify-end gap-1.5", getFlagColor(flag))}>
                                             <span>{getFlagLabel(flag)}</span>
                                             <span>•</span>
                                             <span>{flag === 'high' || flag === 'critical_high' ? 'مرتفع' : 'منخفض'}</span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                                 
                                 {/* Notes field - shown when value entered or expanding */}
                                 <div className="mt-3 overflow-hidden transition-all">
                                    <Input
                                       id={`${test.test_code}-notes`}
                                       value={testValues[test.test_code]?.notes || ""}
                                       onChange={(e) => handleNotesChange(test.test_code, e.target.value)}
                                       placeholder="ملاحظات توضيحية لهذه النتيجة (اختياري)..."
                                       className="h-8 text-sm bg-background/50 border-dashed focus:border-solid hover:bg-background"
                                    />
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               ))}
             </div>

             <div className="space-y-3 pt-6 border-t">
               <Label htmlFor="overall-notes" className="text-base font-medium">ملاحظات عامة على التقرير (اختياري)</Label>
               <Textarea
                 id="overall-notes"
                 value={overallNotes}
                 onChange={(e) => setOverallNotes(e.target.value)}
                 placeholder="أي ملاحظات عامة تظهر في أسفل التقرير..."
                 rows={3}
                 className="resize-none"
               />
             </div>
          </div>
        )}
        </div>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4 shrink-0 sm:justify-start">
          <div className="flex w-full gap-2 sm:w-auto sm:mr-auto">
          {viewMode === "add" ? (
            <>
              <Button variant="outline" onClick={() => {
                // If editing or has history, go back to history. Otherwise close modal.
                if (editingEntryId || (results.entries && results.entries.length > 0)) {
                  setViewMode("history");
                  setEditingEntryId(null);
                  setTestValues({});
                  setOverallNotes("");
                } else {
                  onClose();
                }
              }} disabled={saving}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="min-w-[120px]">
                {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingEntryId ? "تحديث النتائج" : "حفظ النتائج"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              إغلاق
            </Button>
          )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
