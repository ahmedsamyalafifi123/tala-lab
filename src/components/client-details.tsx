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
          className="w-[98vw] max-w-[98vw] md:max-w-5xl h-[95vh] md:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden text-right rounded-t-2xl md:rounded-2xl" 
          dir="rtl"
        >
          <DialogHeader className="p-4 md:p-6 border-b shrink-0 bg-muted/20" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 text-right">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl md:text-2xl border-2 border-primary/20 shrink-0">
                  {client.daily_id}
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <DialogTitle className="text-xl md:text-2xl font-bold mb-0.5 truncate w-full text-right">{client.patient_name}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs md:text-sm">
                      <span className="bg-primary/5 px-1.5 py-0.5 rounded">{formatDate(client.daily_date)}</span>
                      <span>•</span>
                      {client.patient_age && (
                        <>
                          <span>{client.patient_age} سنة</span>
                          <span>•</span>
                        </>
                      )}
                       {client.patient_gender && (
                        <span>
                          {client.patient_gender === 'male' || client.patient_gender === 'ذكر' ? 'ذكر' : 'أنثى'}
                        </span>
                      )}
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end md:self-auto">
                   <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                          onClose();
                          onEdit(client);
                      }}
                      className="h-9 px-3 gap-2"
                   >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تعديل البيانات</span>
                      <span className="sm:hidden">تعديل</span>
                   </Button>

                   <DialogClose asChild>
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <X className="h-5 w-5" />
                          <span className="sr-only">Close</span>
                      </Button>
                   </DialogClose>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
                 {client.insurance_number && (
                   <Badge variant="outline" className="text-[10px] md:text-xs font-mono bg-background border-primary/20">
                     تأمين: {client.insurance_number}
                   </Badge>
                 )}
                 {client.entity && (
                   <Badge variant="secondary" className="text-[10px] md:text-xs bg-primary/5 text-primary border-primary/10">
                     الجهة: {client.entity}
                   </Badge>
                 )}
                 {client.categories && client.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.categories.map((cat, idx) => (
                        <Badge key={idx} variant="default" className="text-[10px] md:text-xs h-5 px-1.5">
                            {cat}
                        </Badge>
                      ))}
                    </div>
                 )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
            <Tabs defaultValue="results" className="flex-1 flex flex-col h-full" dir="rtl">
              <div className="px-4 md:px-6 border-b bg-background shrink-0">
                <TabsList className="w-full justify-start gap-4 md:gap-8 bg-transparent h-12 md:h-14 p-0 rounded-none overflow-x-auto scrollbar-hide">
                  <TabsTrigger 
                    value="results" 
                    className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 md:px-2 font-semibold text-sm md:text-base whitespace-nowrap"
                  >
                    <FlaskConical className="h-4 w-4 md:h-5 md:w-5" />
                    نتائج التحاليل
                  </TabsTrigger>
                  <TabsTrigger 
                    value="info" 
                     className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 md:px-2 font-semibold text-sm md:text-base whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                    المعلومات الشخصية
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trends" 
                     className="gap-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 md:px-2 font-semibold text-sm md:text-base whitespace-nowrap"
                  >
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                    الرسم البياني
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-6">
                <TabsContent value="info" className="space-y-6 mt-0 h-full max-w-4xl mx-auto w-full">
                  {(client.insurance_number || client.entity) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {client.insurance_number && (
                        <Card className="bg-background shadow-sm border-primary/10">
                          <CardContent className="p-4 md:p-6">
                            <p className="text-xs md:text-sm text-muted-foreground mb-1">الرقم التأميني</p>
                            <p className="font-mono text-base md:text-lg font-bold">{client.insurance_number}</p>
                          </CardContent>
                        </Card>
                      )}
                      {client.entity && (
                        <Card className="bg-background shadow-sm border-primary/10">
                          <CardContent className="p-4 md:p-6">
                            <p className="text-xs md:text-sm text-muted-foreground mb-1">الجهة</p>
                            <p className="text-base md:text-lg font-bold text-primary">{client.entity}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {client.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground mr-1">الملاحظات</h4>
                      <Card className="bg-background shadow-sm">
                        <CardContent className="p-4 md:p-6">
                          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                            {client.notes}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase tracking-wider">تم الإنشاء</p>
                        <p className="font-mono text-sm md:text-base font-medium">{formatTime(client.created_at)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1 uppercase tracking-wider">آخر تحديث</p>
                        <p className="font-mono text-sm md:text-base font-medium">{formatTime(client.updated_at)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4 mt-0 h-full flex flex-col max-w-5xl mx-auto w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0 bg-background p-4 rounded-xl border border-primary/5 shadow-sm">
                    <div className="space-y-1">
                        <h3 className="text-base md:text-lg font-bold text-primary">سجل التحاليل</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">عرض النتائج الحالية والسابقة المسجلة</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExportDialog(true)}
                        className="h-9 px-3 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        تصدير
                      </Button>
                      
                      {/* {client.selected_tests && client.selected_tests.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowResultsModal(true)}
                          className="h-9 px-3 gap-2"
                        >
                          <FlaskConical className="w-4 h-4" />
                          إضافة نتائج
                        </Button>
                      )} */}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto rounded-xl border bg-background shadow-md">
                    <ResultsHistoryViewer clientUuid={client.uuid} />
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="mt-0 h-full overflow-auto max-w-5xl mx-auto w-full">
                  <Card className="h-full border-none shadow-none bg-transparent">
                    <CardContent className="p-0 md:p-2 h-full">
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
        clientGender={client.patient_gender}
        clientAge={client.patient_age}
        insuranceNumber={client.insurance_number}
        entity={client.entity}
      />
    </>
  );
}
