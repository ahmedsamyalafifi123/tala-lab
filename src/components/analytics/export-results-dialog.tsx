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
          "Date": format(new Date(entry.recorded_at), "PPP p", { locale: ar }),
          "": "",
          "": "",
          "": "",
        });

        excelData.push({
          "Test": "Name",
          "Result": "Result",
          "Unit": "Unit",
          "Flag": "Flag",
          ...(includeReferenceRanges && { "Reference Range": "Normal Range" }),
          "Notes": "Notes",
        });

        Object.entries(entry.tests).forEach(([testCode, result]) => {
          const test = tests.find((t) => t.test_code === testCode);
          const refRange = test?.reference_ranges.default;

          excelData.push({
            "Test": test?.test_name_en || test?.test_name_ar || testCode,
            "Result": result.value,
            "Unit": result.unit || test?.unit || "-",
            "Flag":
              result.flag === "normal"
                ? "Normal"
                : result.flag === "high"
                ? "High"
                : result.flag === "low"
                ? "Low"
                : result.flag === "critical_high"
                ? "Critical High"
                : result.flag === "critical_low"
                ? "Critical Low"
                : "Normal",
            ...(includeReferenceRanges &&
              refRange && {
                "Reference Range": `${refRange.min} - ${refRange.max}`,
              }),
            "Notes": result.notes || "-",
          });
        });

        if (entry.notes) {
          excelData.push({});
          excelData.push({
            "Test": "General Notes:",
            "Result": entry.notes,
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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const entries = getSortedEntries();

    let html = `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Medical Report - ${clientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.5;
            color: #1a202c;
            margin: 0;
            padding: 0;
          }

          .report-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2d3748;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .lab-brand {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .logo-placeholder {
            width: 60px;
            height: 60px;
            background: #2d3748;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
          }

          .lab-info h1 {
            margin: 0;
            font-size: 24px;
            color: #1a202c;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .report-title {
            text-align: right;
          }

          .report-title h2 {
            margin: 0;
            color: #4a5568;
            font-size: 18px;
            font-weight: 600;
          }

          .patient-card {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-cols: repeat(2, 1fr);
            gap: 15px;
          }

          .info-item {
            display: flex;
            gap: 10px;
          }

          .info-label {
            color: #718096;
            font-weight: 600;
            min-width: 100px;
          }

          .entry {
            margin-bottom: 40px;
          }

          .entry-date {
            font-size: 14px;
            font-weight: 700;
            color: #2d3748;
            background: #edf2f7;
            padding: 8px 15px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 15px;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 15px;
          }

          th {
            background: #2d3748;
            color: white;
            text-align: left;
            padding: 12px 15px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }

          th:first-child { border-top-left-radius: 8px; }
          th:last-child { border-top-right-radius: 8px; }

          td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }

          .test-name { font-weight: 600; color: #2d3748; }
          .result-value { font-family: monospace; font-weight: 700; font-size: 16px; }
          
          .flag-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .flag-normal { color: #2f855a; }
          .flag-high, .flag-low { background: #feebc8; color: #c05621; }
          .flag-critical { background: #fed7d7; color: #c53030; }

          .notes-box {
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 15px;
            margin-top: 10px;
            font-size: 13px;
            color: #744210;
          }

          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            color: #a0aec0;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <header class="header">
            <div class="lab-brand">
              <div class="logo-placeholder">LAB</div>
              <div class="lab-info">
                <h1>Medical Laboratory</h1>
                <p style="margin:0; font-size: 12px; color: #718096;">Professional Diagnostic Services</p>
              </div>
            </div>

          </header>

          <div class="patient-card">
            <div class="info-item">
              <span class="info-label">Patient Name:</span>
              <span>${clientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report ID:</span>
              <span style="font-family: monospace;">${clientUuid.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>
    `;

    entries.forEach((entry) => {
      html += `
        <div class="entry">
          <div class="entry-date">Collection Date: ${format(new Date(entry.recorded_at), "PPP p", { locale: ar })}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 35%">Test Name</th>
                <th style="width: 15%; text-align: center;">Result</th>
                <th style="width: 10%; text-align: center;">Unit</th>
                <th style="width: 20%; text-align: center;">Status</th>
                ${includeReferenceRanges ? "<th style='width: 20%; text-align: center;'>Reference Range</th>" : ""}
              </tr>
            </thead>
            <tbody>
      `;

      Object.entries(entry.tests).forEach(([testCode, result]) => {
        const test = tests.find((t) => t.test_code === testCode);
        const refRange = test?.reference_ranges.default;
        
        let flagClass = "flag-normal";
        if (result.flag === "critical_high" || result.flag === "critical_low") flagClass = "flag-critical";
        else if (result.flag === "high" || result.flag === "low") flagClass = "flag-high";

        const flagLabel = result.flag ? (
          result.flag === "normal" ? "Normal" :
          result.flag === "high" ? "High" :
          result.flag === "low" ? "Low" :
          result.flag === "critical_high" ? "Critical High" : "Critical Low"
        ) : "Normal";

        html += `
          <tr>
            <td class="test-name">${test?.test_name_en || test?.test_name_ar || testCode}</td>
            <td class="result-value" style="text-align: center;">${result.value}</td>
            <td style="text-align: center; color: #718096;">${result.unit || test?.unit || "-"}</td>
            <td style="text-align: center;">
              <span class="flag-badge ${flagClass}">${flagLabel}</span>
            </td>
            ${includeReferenceRanges ? `
              <td style="text-align: center; font-size: 12px; color: #4a5568;">
                ${refRange ? `${refRange.min} - ${refRange.max}` : "-"}
              </td>
            ` : ""}
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
      `;

      if (entry.notes) {
        html += `<div class="notes-box"><strong>Comments:</strong> ${entry.notes}</div>`;
      }

      html += `</div>`;
    });

    html += `
          <div class="footer">
            <span>Generated on: ${format(new Date(), "PPP p", { locale: ar })}</span>
            <span>Electronic Copy - No Signature Required</span>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Add a small delay to ensure styles are loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);

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
