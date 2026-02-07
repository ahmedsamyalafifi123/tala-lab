"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLabTests } from "@/hooks/use-lab-tests";
import { useClientResults } from "@/hooks/use-client-results";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ExportResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientUuid: string;
  clientName: string;
}

export function ExportResultsDialog({
  isOpen,
  onClose,
  clientUuid,
  clientName,
}: ExportResultsDialogProps) {
  const { toast } = useToast();
  const { tests } = useLabTests();
  const { results, getSortedEntries } = useClientResults(clientUuid);
  const [exporting, setExporting] = useState(false);
  const [includeReferenceRanges, setIncludeReferenceRanges] = useState(true);

  const handleExportExcel = async () => {
    setExporting(true);

    try {
      const entries = getSortedEntries();

      if (entries.length === 0) {
        toast({
          title: "لا توجد نتائج",
          description: "لا توجد نتائج للتصدير",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for Excel
      const excelData: any[] = [];

      // Add header row
      excelData.push({
        "اسم المريض": clientName,
        "": "",
        "": "",
        "": "",
      });
      excelData.push({}); // Empty row

      // Add results
      entries.forEach((entry) => {
        excelData.push({
          التاريخ: format(new Date(entry.recorded_at), "PPP p", { locale: ar }),
          "": "",
          "": "",
          "": "",
        });

        excelData.push({
          التحليل: "الاسم",
          القيمة: "النتيجة",
          الوحدة: "الوحدة",
          الحالة: "الحالة",
          ...(includeReferenceRanges && { "القيم الطبيعية": "المدى الطبيعي" }),
          الملاحظات: "ملاحظات",
        });

        Object.entries(entry.tests).forEach(([testCode, result]) => {
          const test = tests.find((t) => t.test_code === testCode);
          const refRange = test?.reference_ranges.default;

          excelData.push({
            التحليل: test?.test_name_en || test?.test_name_ar || testCode,
            القيمة: result.value,
            الوحدة: result.unit || test?.unit || "-",
            الحالة:
              result.flag === "normal"
                ? "طبيعي"
                : result.flag === "high"
                ? "مرتفع"
                : result.flag === "low"
                ? "منخفض"
                : result.flag === "critical_high"
                ? "مرتفع جداً"
                : result.flag === "critical_low"
                ? "منخفض جداً"
                : "-",
            ...(includeReferenceRanges &&
              refRange && {
                "القيم الطبيعية": `${refRange.min} - ${refRange.max}`,
              }),
            الملاحظات: result.notes || "-",
          });
        });

        if (entry.notes) {
          excelData.push({});
          excelData.push({
            التحليل: "ملاحظات عامة:",
            القيمة: entry.notes,
          });
        }

        excelData.push({}); // Empty row between entries
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });

      // Set column widths
      ws["!cols"] = [
        { wch: 30 }, // Test name
        { wch: 15 }, // Value
        { wch: 15 }, // Unit
        { wch: 15 }, // Status
        ...(includeReferenceRanges ? [{ wch: 20 }] : []), // Reference range
        { wch: 30 }, // Notes
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "نتائج التحاليل");

      // Generate filename
      const filename = `نتائج_${clientName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

      toast({
        title: "تم التصدير",
        description: "تم تصدير النتائج إلى Excel بنجاح",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التصدير",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    // Open print dialog with custom styles
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const entries = getSortedEntries();

    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>نتائج التحاليل - ${clientName}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
          }
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            padding: 20px;
          }
          h1 {
            text-align: center;
            color: #333;
            border-bottom: 2px solid #666;
            padding-bottom: 10px;
          }
          .entry {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .entry-header {
            background: #f5f5f5;
            padding: 10px;
            margin-bottom: 15px;
            border-right: 4px solid #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: right;
          }
          th {
            background: #f9f9f9;
            font-weight: bold;
          }
          .flag-normal { color: #16a34a; font-weight: bold; }
          .flag-high { color: #eab308; font-weight: bold; }
          .flag-low { color: #eab308; font-weight: bold; }
          .flag-critical { color: #dc2626; font-weight: bold; }
          .notes {
            background: #f9f9f9;
            padding: 10px;
            border-right: 3px solid #666;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>نتائج التحاليل الطبية</h1>
        <p style="text-align: center; font-size: 18px; margin: 20px 0;"><strong>المريض:</strong> ${clientName}</p>
    `;

    entries.forEach((entry) => {
      html += `
        <div class="entry">
          <div class="entry-header">
            <strong>التاريخ:</strong> ${format(new Date(entry.recorded_at), "PPP p", { locale: ar })}
          </div>
          <table>
            <thead>
              <tr>
                <th>التحليل</th>
                <th>النتيجة</th>
                <th>الوحدة</th>
                <th>الحالة</th>
                ${includeReferenceRanges ? "<th>القيم الطبيعية</th>" : ""}
              </tr>
            </thead>
            <tbody>
      `;

      Object.entries(entry.tests).forEach(([testCode, result]) => {
        const test = tests.find((t) => t.test_code === testCode);
        const refRange = test?.reference_ranges.default;
        const flagClass =
          result.flag === "normal"
            ? "flag-normal"
            : result.flag === "critical_high" || result.flag === "critical_low"
            ? "flag-critical"
            : "flag-high";

        html += `
          <tr>
            <td>${test?.test_name_en || test?.test_name_ar || testCode}</td>
            <td><strong>${result.value}</strong></td>
            <td>${result.unit || test?.unit || "-"}</td>
            <td class="${flagClass}">
              ${
                result.flag === "normal"
                  ? "طبيعي"
                  : result.flag === "high"
                  ? "مرتفع"
                  : result.flag === "low"
                  ? "منخفض"
                  : result.flag === "critical_high"
                  ? "مرتفع جداً"
                  : result.flag === "critical_low"
                  ? "منخفض جداً"
                  : "-"
              }
            </td>
            ${
              includeReferenceRanges && refRange
                ? `<td>${refRange.min} - ${refRange.max}</td>`
                : ""
            }
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
      `;

      if (entry.notes) {
        html += `<div class="notes"><strong>ملاحظات:</strong> ${entry.notes}</div>`;
      }

      html += `</div>`;
    });

    html += `
        <p style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          تم الطباعة في: ${format(new Date(), "PPP p", { locale: ar })}
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تصدير نتائج التحاليل</DialogTitle>
          <DialogDescription>
            اختر صيغة التصدير والخيارات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="include-reference"
              checked={includeReferenceRanges}
              onCheckedChange={(checked) => setIncludeReferenceRanges(checked as boolean)}
            />
            <label
              htmlFor="include-reference"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              تضمين القيم الطبيعية المرجعية
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            إلغاء
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
          <Button onClick={handleExportExcel} disabled={exporting}>
            {exporting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            <FileSpreadsheet className="ml-2 h-4 w-4" />
            تصدير Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
