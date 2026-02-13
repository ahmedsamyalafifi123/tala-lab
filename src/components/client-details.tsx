"use client";

import { useState } from "react";
import { Pencil, FlaskConical, FileText, TrendingUp, Download, X } from "lucide-react";
import { Client } from "@/types";
import { TestResultsModal } from "@/components/results/test-results-modal";
import { ResultsHistoryViewer } from "@/components/results/results-history-viewer";
import { ClientTrendChart } from "@/components/analytics/client-trend-chart";
import { ExportResultsDialog } from "@/components/analytics/export-results-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ClientDetailsProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

export function ClientDetails({
  client,
  isOpen,
  onClose,
  onEdit,
}: ClientDetailsProps) {
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden text-right !max-w-[95vw]" 
          dir="rtl"
        >
          <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between space-y-0 text-right" dir="rtl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20 shrink-0">
                {client.daily_id}
              </div>
              <div className="flex flex-col items-start text-right">
                  <DialogTitle className="text-2xl font-bold mb-1 text-right">{client.patient_name}</DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-right">
                    <span className="text-sm">{formatDate(client.daily_date)}</span>
                    {client.patient_age && (
                      <>
                        <span>•</span>
                        <span className="text-sm">{client.patient_age} سنة</span>
                      </>
                    )}
                     {client.patient_gender && (
                      <>
                        <span>•</span>
                        <span className="text-sm">
                          {client.patient_gender === 'male' || client.patient_gender === 'ذكر' ? 'ذكر' : 'أنثى'}
                        </span>
                      </>
                    )}
                  </div>
              </div>
            </div>
            
             <div className="flex items-center gap-3">
                 {client.insurance_number && (
                   <Badge variant="outline" className="text-xs font-mono">
                     تأمين: {client.insurance_number}
                   </Badge>
                 )}
                 {client.entity && (
                   <Badge variant="secondary" className="text-xs">
                     الجهة: {client.entity}
                   </Badge>
                 )}
                 {client.categories && client.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.categories.map((cat, idx) => (
                        <Badge key={idx} variant={cat === "صحة مدرسية" ? "default" : "secondary"} className="text-sm">
                            {cat === "صحة مدرسية" ? "صحة" : (cat === "CBC" ? "CBC" : cat)}
                        </Badge>
                      ))}
                    </div>
                 )}
                 
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        onClose();
                        onEdit(client);
                    }}
                    className="gap-2"
                 >
                    <Pencil className="w-4 h-4" />
                    تعديل البيانات
                 </Button>

                 <DialogClose asChild>
                    <Button type="button" variant="ghost" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                 </DialogClose>
             </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
            <Tabs defaultValue="results" className="flex-1 flex flex-col h-full" dir="rtl">
              <div className="px-6 border-b bg-background">
                <TabsList className="w-full justify-start gap-8 bg-transparent h-14 p-0 rounded-none">
                  <TabsTrigger 
                    value="results" 
                    className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-2 font-semibold text-base"
                  >
                    <FlaskConical className="h-5 w-5" />
                    نتائج التحاليل
                  </TabsTrigger>
                  <TabsTrigger 
                    value="info" 
                     className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-2 font-semibold text-base"
                  >
                    <FileText className="h-5 w-5" />
                    المعلومات الشخصية
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trends" 
                     className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-2 font-semibold text-base"
                  >
                    <TrendingUp className="h-5 w-5" />
                    الرسم البياني
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <TabsContent value="info" className="space-y-6 mt-0 h-full max-w-4xl mx-auto w-full">
                  {(client.insurance_number || client.entity) && (
                    <div className="grid grid-cols-2 gap-6">
                      {client.insurance_number && (
                        <Card>
                          <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground mb-2">الرقم التأميني</p>
                            <p className="font-mono text-lg">{client.insurance_number}</p>
                          </CardContent>
                        </Card>
                      )}
                      {client.entity && (
                        <Card>
                          <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground mb-2">الجهة</p>
                            <p className="text-lg font-bold">{client.entity}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {client.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">الملاحظات</h4>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {client.notes}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-2">تم الإنشاء</p>
                        <p className="font-mono text-lg">{formatTime(client.created_at)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-2">آخر تحديث</p>
                        <p className="font-mono text-lg">{formatTime(client.updated_at)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4 mt-0 h-full flex flex-col max-w-5xl mx-auto w-full">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">سجل التحاليل</h3>
                        <p className="text-sm text-muted-foreground">عرض جميع نتائج التحاليل السابقة والحالية</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExportDialog(true)}
                      >
                        <Download className="ml-2 h-4 w-4" />
                        تصدير
                      </Button>
                      
                      {/* Add Results Button */}
                      {client.selected_tests && client.selected_tests.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowResultsModal(true)}
                        >
                          <FlaskConical className="w-4 h-4 me-2" />
                          إضافة نتائج
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto rounded-lg border bg-background shadow-sm">
                    <ResultsHistoryViewer clientUuid={client.uuid} />
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="mt-0 h-full overflow-auto max-w-5xl mx-auto w-full">
                  <Card className="h-full">
                    <CardContent className="p-6 h-full">
                        <ClientTrendChart
                            clientUuid={client.uuid}
                            clientGender={client.patient_gender}
                            clientAge={client.patient_age}
                        />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

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
