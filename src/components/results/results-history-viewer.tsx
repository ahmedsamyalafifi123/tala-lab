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
import { Loader2, Trash2, Calendar, FileText } from "lucide-react";
import { getFlagColor, getFlagIcon, getFlagLabel } from "@/lib/test-utils";
import type { ResultEntry } from "@/types/results";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
    return test ? test.test_name_ar : testCode;
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
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            لا توجد نتائج تحاليل حتى الآن
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedEntries.map((entry) => (
          <Card key={entry.entry_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">
                      {format(new Date(entry.recorded_at), "PPP", { locale: ar })}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.recorded_at), "p", { locale: ar })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(entry)}
                  disabled={deletingEntry === entry.entry_id}
                >
                  {deletingEntry === entry.entry_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التحليل</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الوحدة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(entry.tests).map(([testCode, result]) => (
                      <TableRow key={testCode}>
                        <TableCell className="font-medium">
                          {getTestName(testCode)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {result.value}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {result.unit || getTestUnit(testCode) || "-"}
                        </TableCell>
                        <TableCell>
                          {result.flag && (
                            <Badge className={`${getFlagColor(result.flag)}`}>
                              <span className="ml-1">{getFlagIcon(result.flag)}</span>
                              {getFlagLabel(result.flag)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {result.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {entry.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">ملاحظات عامة:</p>
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه النتائج؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingEntry}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
