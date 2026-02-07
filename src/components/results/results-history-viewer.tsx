"use strict";
"use client";

import { useState } from "react";
import { useLabTests } from "@/hooks/use-lab-tests";
import { useClientResults } from "@/hooks/use-client-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Trash2, Calendar, FileText, Beaker, ClipboardList } from "lucide-react";
import { getFlagColor, getFlagIcon, getFlagLabel } from "@/lib/test-utils";
import type { ResultEntry } from "@/types/results";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { groupTestsByCategory } from "@/lib/test-utils";

interface ResultsHistoryViewerProps {
  clientUuid: string;
}

export function ResultsHistoryViewer({ clientUuid }: ResultsHistoryViewerProps) {
  const { tests } = useLabTests();
  const { results, deleteResultEntry, getSortedEntries, loading } = useClientResults(clientUuid);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ResultEntry | null>(null);

  const sortedEntries = getSortedEntries();

  const getTestName = (testCode: string) => {
    const test = tests.find((t) => t.test_code === testCode);
    return test ? (test.test_name_en || test.test_name_ar) : testCode;
  };

  const getTestUnit = (testCode: string) => {
    const test = tests.find((t) => t.test_code === testCode);
    return test?.unit;
  };

  const handleDeleteClick = (entry: ResultEntry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    setDeletingEntry(entryToDelete.entry_id);
    const result = await deleteResultEntry(entryToDelete.entry_id);

    if (result.error) {
      alert("حدث خطأ أثناء الحذف");
    }

    setDeletingEntry(null);
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed rounded-xl bg-muted/30">
        <div className="bg-primary/10 p-4 rounded-full">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">لا توجد نتائج مسجلة</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
            لم يتم تسجيل أي نتائج تحاليل لهذا العميل حتى الآن.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 relative">
        <div className="absolute right-[19px] top-4 bottom-4 w-0.5 bg-border -z-10 hidden md:block" />
        
        {sortedEntries.map((entry, index) => {
          // Group tests by category for this entry
          const entryTests = Object.entries(entry.tests).map(([code, result]) => {
             const test = tests.find(t => t.test_code === code);
             return { code, result, test };
          });
          
          // Re-group using our helper logic manually since the data structure is slightly different
          const groupedTests: Record<string, typeof entryTests> = {};
          
          entryTests.forEach(item => {
            const category = item.test?.category || "عام";
            if (!groupedTests[category]) {
              groupedTests[category] = [];
            }
            groupedTests[category].push(item);
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

                 {/* Content Card */}
                 <Card className={cn(
                    "flex-1 overflow-hidden transition-all duration-200",
                    isLatest ? "border-primary/50 shadow-md" : "hover:border-primary/30"
                 )}>
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <CardTitle className="text-lg flex items-center gap-2">
                             {format(new Date(entry.recorded_at), "PPP", { locale: ar })}
                           </CardTitle>
                           {isLatest && (
                             <Badge variant="default" className="text-[10px] px-2 h-5">الأحدث</Badge>
                           )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-primary/40" />
                          {format(new Date(entry.recorded_at), "p", { locale: ar })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDeleteClick(entry)}
                        disabled={deletingEntry === entry.entry_id}
                        title="حذف النتائج"
                      >
                        {deletingEntry === entry.entry_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Render grouped tests */}
                    <div className="divide-y">
                      {Object.entries(groupedTests).map(([category, items]) => (
                        <div key={category} className="p-4 md:p-6">
                           <div className="flex items-center gap-2 mb-4">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                 <Beaker className="h-4 w-4" />
                              </div>
                              <h4 className="font-semibold text-base">{category}</h4>
                              <Badge variant="secondary" className="mr-auto text-xs font-normal">
                                 {items.length} تحليل
                              </Badge>
                           </div>

                           <div className="bg-card border rounded-lg overflow-hidden">
                              <Table>
                                 <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                       <TableHead className="w-[30%] text-right font-medium">التحليل</TableHead>
                                       <TableHead className="w-[20%] text-center font-medium">النتيجة</TableHead>
                                       <TableHead className="w-[15%] text-center font-medium">الوحدة</TableHead>
                                       <TableHead className="w-[20%] text-center font-medium">الحالة</TableHead>
                                       <TableHead className="w-[15%] text-right font-medium">ملاحظات</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {items.map(({ code, result, test }) => (
                                       <TableRow key={code} className="hover:bg-muted/20">
                                          <TableCell className="font-medium text-right py-3" dir="ltr">
                                             {test?.test_name_en || test?.test_name_ar || code}
                                          </TableCell>
                                          <TableCell className="text-center font-mono font-semibold py-3" dir="ltr">
                                             {result.value}
                                          </TableCell>
                                          <TableCell className="text-center text-muted-foreground text-xs py-3">
                                             {result.unit || test?.unit || "-"}
                                          </TableCell>
                                          <TableCell className="text-center py-3">
                                             {result.flag && (
                                                <Badge 
                                                   variant="outline" 
                                                   className={cn(
                                                      "font-normal border-0 items-center gap-1.5 px-2.5 py-1 justify-center min-w-[90px]",
                                                      getFlagColor(result.flag)
                                                   )}
                                                >
                                                   <span>{getFlagIcon(result.flag)}</span>
                                                   <span>{getFlagLabel(result.flag)}</span>
                                                </Badge>
                                             )}
                                             {!result.flag && (
                                                <Badge variant="outline" className="font-normal text-muted-foreground border-border/50 bg-muted/20">
                                                   طبيعي
                                                </Badge>
                                             )}
                                          </TableCell>
                                          <TableCell className="text-right text-sm text-muted-foreground py-3 max-w-[150px] truncate">
                                             {result.notes || "-"}
                                          </TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                           </div>
                        </div>
                      ))}
                    </div>

                    {entry.notes && (
                      <div className="bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/30 p-4 flex gap-3">
                        <ClipboardList className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">ملاحظات عامة</p>
                          <p className="text-sm text-amber-800/80 dark:text-amber-200/70 leading-relaxed">{entry.notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[400px] rounded-xl">
          <AlertDialogHeader>
            <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
               <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">تأكيد حذف النتائج</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              هل أنت متأكد من رغبتك في حذف سجل النتائج هذا؟
              <br />
              <span className="text-destructive font-semibold">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel disabled={!!deletingEntry} className="w-full sm:w-auto mt-0">
               إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              {deletingEntry ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، احذف النتائج"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
