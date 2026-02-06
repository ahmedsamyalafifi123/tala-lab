"use client";

import { useState } from "react";
import { Trash2, Pencil, Loader2, FlaskConical, FileText, TrendingUp, Download } from "lucide-react";
import { Client } from "@/types";
import { TestResultsModal } from "@/components/results/test-results-modal";
import { ResultsHistoryViewer } from "@/components/results/results-history-viewer";
import { ClientTrendChart } from "@/components/analytics/client-trend-chart";
import { ExportResultsDialog } from "@/components/analytics/export-results-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface ClientDetailsProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => Promise<void>;
  isDeleting?: boolean;
}

export function ClientDetails({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: ClientDetailsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  if (!client) return null;

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    await onDelete(client);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] sm:h-[60vh] rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {client.daily_id}
                  </div>
                  <div>
                    <SheetTitle className="text-xl text-start">{client.patient_name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{formatDate(client.daily_date)}</p>
                  </div>
                </div>
                {client.categories && client.categories.length > 0 && (
                   <div className="flex gap-1">
                      {client.categories.map((cat, idx) => (
                        <Badge key={idx} variant={cat === "صحة مدرسية" ? "default" : "secondary"}>
                            {cat === "صحة مدرسية" ? "صحة" : (cat === "CBC" ? "CBC" : cat)}
                        </Badge>
                      ))}
                   </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-auto p-4">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="info" className="gap-2">
                    <FileText className="h-4 w-4" />
                    المعلومات
                  </TabsTrigger>
                  <TabsTrigger value="results" className="gap-2">
                    <FlaskConical className="h-4 w-4" />
                    النتائج
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    الرسم البياني
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  {client.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">الملاحظات</h4>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {client.notes}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">تم الإنشاء</p>
                        <p className="font-medium">{formatTime(client.created_at)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">آخر تحديث</p>
                        <p className="font-medium">{formatTime(client.updated_at)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportDialog(true)}
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تصدير النتائج
                    </Button>
                  </div>
                  <ResultsHistoryViewer clientUuid={client.uuid} />
                </TabsContent>

                <TabsContent value="trends">
                  <ClientTrendChart
                    clientUuid={client.uuid}
                    clientGender={client.patient_gender}
                    clientAge={client.patient_age}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="flex flex-col gap-3 w-full">
                {/* Add Results Button - Only show if client has selected tests */}
                {client.selected_tests && client.selected_tests.length > 0 && (
                  <Button
                    variant="default"
                    className="w-full h-12 text-lg"
                    onClick={() => {
                      setShowResultsModal(true);
                    }}
                  >
                    <FlaskConical className="w-5 h-5 me-2" />
                    إضافة نتائج التحاليل ({client.selected_tests.length} تحليل)
                  </Button>
                )}

                <div className="flex gap-3 w-full">
                  <Button
                    variant="destructive"
                    className="flex-1 h-12 text-lg"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-5 h-5 me-2" />
                    حذف
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-lg"
                    onClick={() => {
                      onClose();
                      onEdit(client);
                    }}
                  >
                    <Pencil className="w-5 h-5 me-2" />
                    تعديل
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حالة <strong>{client.patient_name}</strong>؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
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

      <TestResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        clientUuid={client.uuid}
        clientName={client.patient_name}
        clientGender={client.patient_gender}
        clientAge={client.patient_age}
      />

      <ExportResultsDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        clientUuid={client.uuid}
        clientName={client.patient_name}
      />
    </>
  );
}
