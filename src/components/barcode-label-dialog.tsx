"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Printer, Search, X } from "lucide-react";
import { Client } from "@/types";
import { useLabContext } from "@/contexts/LabContext";
import { useLabTests } from "@/hooks/use-lab-tests";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BarcodeLabelDialogProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

type LabelSize = {
  widthMm: number;
  heightMm: number;
};

const LABEL_SIZE_STORAGE_KEY = "barcode-label-size-mm";
const DEFAULT_LABEL_SIZE: LabelSize = { widthMm: 50, heightMm: 25 };
const LABEL_SIZE_PRESETS = [
  { id: "tube-small", label: "40 x 20", widthMm: 40, heightMm: 20 },
  { id: "tube-standard", label: "50 x 25", widthMm: 50, heightMm: 25 },
  { id: "medium", label: "60 x 30", widthMm: 60, heightMm: 30 },
  { id: "rp310-wide", label: "76 x 38", widthMm: 76, heightMm: 38 },
];

const CODE128_PATTERNS = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", "10001001100",
  "10011001000", "10011000100", "10001100100", "11001001000", "11001000100", "11000100100",
  "10110011100", "10011011100", "10011001110", "10111001100", "10011101100", "10011100110",
  "11001110010", "11001011100", "11001001110", "11011100100", "11001110100", "11101101110",
  "11101001100", "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", "10001000110",
  "10110001000", "10001101000", "10001100010", "11010001000", "11000101000", "11000100010",
  "10110111000", "10110001110", "10001101110", "10111011000", "10111000110", "10001110110",
  "11101110110", "11010001110", "11000101110", "11011101000", "11011100010", "11011101110",
  "11101011000", "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100", "10010110000",
  "10010000110", "10000101100", "10000100110", "10110010000", "10110000100", "10011010000",
  "10011000010", "10000110100", "10000110010", "11000010010", "11001010000", "11110111010",
  "11000010100", "10001111010", "10100111100", "10010111100", "10010011110", "10111100100",
  "10011110100", "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110", "10111101000",
  "10111100010", "11110101000", "11110100010", "10111011110", "10111101110", "11101011110",
  "11110101110", "11010000100", "11010010000", "11010011100", "1100011101011",
];

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sanitizeBarcodeValue = (value: string) => value.replace(/[^\x20-\x7f]/g, "").slice(0, 32) || "0";

const clampLabelDimension = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const normalizeLabelSize = (size: LabelSize): LabelSize => ({
  widthMm: clampLabelDimension(Math.round(size.widthMm), 30, 80),
  heightMm: clampLabelDimension(Math.round(size.heightMm), 15, 80),
});

const formatCm = (mm: number) => (mm / 10).toFixed(1).replace(/\.0$/, "");

const readStoredLabelSize = () => {
  if (typeof window === "undefined") return DEFAULT_LABEL_SIZE;

  try {
    const stored = localStorage.getItem(LABEL_SIZE_STORAGE_KEY);
    if (!stored) return DEFAULT_LABEL_SIZE;

    const parsed = JSON.parse(stored) as Partial<LabelSize>;
    return normalizeLabelSize({
      widthMm: Number(parsed.widthMm) || DEFAULT_LABEL_SIZE.widthMm,
      heightMm: Number(parsed.heightMm) || DEFAULT_LABEL_SIZE.heightMm,
    });
  } catch {
    return DEFAULT_LABEL_SIZE;
  }
};

function getCode128Pattern(value: string) {
  const text = sanitizeBarcodeValue(value);
  const codes = [104, ...text.split("").map((char) => char.charCodeAt(0) - 32)];
  const checksum = codes.reduce((total, code, index) => total + (index === 0 ? code : code * index), 0) % 103;
  return [...codes, checksum, 106].map((code) => CODE128_PATTERNS[code]).join("");
}

function renderBarcodeSvg(value: string, height = 52) {
  const pattern = getCode128Pattern(value);
  const width = pattern.length;
  const bars = pattern
    .split("")
    .map((bit, index) => bit === "1" ? `<rect x="${index}" y="0" width="1" height="${height}" />` : "")
    .join("");

  return `<svg class="barcode-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

export function BarcodeLabelDialog({ client, isOpen, onClose }: BarcodeLabelDialogProps) {
  const { labName, labSlug } = useLabContext();
  const { tests } = useLabTests();
  const [selectionByClient, setSelectionByClient] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [labelSize, setLabelSizeState] = useState<LabelSize>(() => readStoredLabelSize());

  const availableTests = client?.selected_tests?.length
    ? client.selected_tests.map((code) => {
      const test = tests.find((item) => item.test_code === code);
      return {
        code,
        name: test?.test_name_en || test?.test_name_ar || code,
        category: test?.category || "",
      };
    })
    : [];

  const query = search.trim().toLowerCase();
  const filteredTests = query
    ? availableTests.filter((test) =>
      test.code.toLowerCase().includes(query) ||
      test.name.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query)
    )
    : availableTests;

  if (!client) return null;

  const selectedTests = selectionByClient[client.uuid] || client.selected_tests || [];
  const normalizedLabelSize = normalizeLabelSize(labelSize);
  const matchingPresetId = LABEL_SIZE_PRESETS.find(
    (preset) => preset.widthMm === normalizedLabelSize.widthMm && preset.heightMm === normalizedLabelSize.heightMm
  )?.id;
  const labDisplayName = labName || (labSlug ? `معمل ${labSlug}` : "المعمل");
  const barcodeValue = sanitizeBarcodeValue(`${client.daily_id}-${client.uuid.slice(0, 8).toUpperCase()}`);
  const patientGender = client.patient_gender
    ? (client.patient_gender === "male" || client.patient_gender === "ذكر" ? "Male" : "Female")
    : "";
  const patientAge = typeof client.patient_age === "number" ? `${client.patient_age} Years` : "";
  const sampleDateTime = format(new Date(client.created_at || client.daily_date), "yyyy-MM-dd h:mm a");
  const selectedLabels = selectedTests.map((code) => {
    const test = availableTests.find((item) => item.code === code);
    return test?.name || code;
  });

  const toggleTest = (code: string) => {
    setSelectionByClient((prev) => {
      const current = prev[client.uuid] || client.selected_tests || [];
      const next = current.includes(code) ? current.filter((item) => item !== code) : [...current, code];
      return { ...prev, [client.uuid]: next };
    });
  };

  const setLabelSize = (nextSize: LabelSize) => {
    const next = normalizeLabelSize(nextSize);
    setLabelSizeState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LABEL_SIZE_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const getPrintHtml = () => {
    const testsText = selectedLabels.length > 0 ? selectedLabels.join(", ") : "No tests selected";
    const widthMm = normalizedLabelSize.widthMm;
    const heightMm = normalizedLabelSize.heightMm;
    const compact = widthMm <= 50 || heightMm <= 25;
    const verySmall = widthMm <= 42 || heightMm <= 20;
    const marginMm = verySmall ? 0.5 : compact ? 0.7 : 1;
    const paddingX = verySmall ? 0.9 : compact ? 1.1 : 1.7;
    const paddingY = verySmall ? 0.7 : compact ? 0.85 : 1.2;
    const gapMm = verySmall ? 0.22 : compact ? 0.32 : 0.55;
    const nameFont = verySmall ? 7.2 : compact ? 8 : 10;
    const metaFont = verySmall ? 5.4 : compact ? 6.2 : 7.4;
    const testsFont = verySmall ? 6.2 : compact ? 7.1 : 8.3;
    const testsHeight = Math.max(3.3, Math.min(verySmall ? 4.2 : compact ? 5 : 7, heightMm * 0.22));
    const codeFont = verySmall ? 5.2 : compact ? 6 : 7.2;
    const barcodeHeight = Math.max(5.8, Math.min(verySmall ? 7.2 : compact ? 8.2 : 11.5, heightMm - testsHeight - (verySmall ? 9 : compact ? 10.3 : 13.5)));
    const barcodeWidth = Math.max(22, widthMm - (verySmall ? 3 : compact ? 4 : 7));

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>Barcode Label - ${escapeHtml(client.patient_name)}</title>
  <style>
    @font-face { font-family: 'Cairo'; src: url('/assets/Cairo.ttf') format('truetype'); font-weight: 400; }
    @page { size: ${widthMm}mm ${heightMm}mm; margin: ${marginMm}mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: ${widthMm}mm;
      min-height: ${heightMm}mm;
      background: #fff;
      color: #000;
      font-family: Arial, 'Cairo', sans-serif;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .label {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      padding: ${paddingY}mm ${paddingX}mm;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto auto ${testsHeight}mm minmax(0, 1fr);
      gap: ${gapMm}mm;
      border: 0.25mm solid #000;
    }
    .top {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: ${compact ? 1 : 2}mm;
      align-items: end;
      padding-bottom: ${compact ? 0.1 : 0.25}mm;
    }
    .name {
      font-family: 'Cairo', Arial, sans-serif;
      font-size: ${nameFont}px;
      font-weight: 800;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lab { font-size: ${verySmall ? 4.8 : compact ? 5.5 : 7}px; font-weight: 700; white-space: nowrap; }
    .meta {
      direction: ltr;
      text-align: left;
      display: flex;
      justify-content: space-between;
      gap: ${compact ? 1 : 2}mm;
      font-size: ${metaFont}px;
      font-weight: 800;
      line-height: 1;
    }
    .tests {
      direction: ltr;
      text-align: left;
      font-size: ${testsFont}px;
      font-weight: 800;
      line-height: 1.2;
      min-height: ${testsHeight}mm;
      max-height: ${testsHeight}mm;
      overflow: hidden;
      overflow-wrap: anywhere;
      border-top: 0.2mm solid #000;
      padding: ${verySmall ? 0.15 : 0.25}mm 0;
    }
    .barcode-wrap {
      direction: ltr;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      overflow: hidden;
    }
    .barcode-svg {
      width: ${barcodeWidth}mm;
      height: ${barcodeHeight}mm;
      display: block;
      fill: #000;
      shape-rendering: crispEdges;
    }
    .code {
      direction: ltr;
      font-size: ${codeFont}px;
      font-weight: 800;
      font-family: Arial, sans-serif;
      letter-spacing: 0;
      text-align: center;
      line-height: 1;
      margin-top: ${verySmall ? 0.05 : 0.15}mm;
    }
    @media print {
      html, body { width: ${widthMm}mm; height: ${heightMm}mm; }
      .label { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="top">
      <div class="name">${escapeHtml(client.patient_name)}</div>
      <div class="lab">${escapeHtml(labDisplayName)}</div>
    </div>
    <div class="meta">
      <span>${escapeHtml([patientGender, patientAge].filter(Boolean).join(" - "))}</span>
      <span>Date: ${escapeHtml(sampleDateTime)}</span>
      <span>#${escapeHtml(String(client.daily_id))}</span>
    </div>
    <div class="tests">${escapeHtml(testsText)}</div>
    <div class="barcode-wrap">
      <div>
        ${renderBarcodeSvg(barcodeValue)}
        <div class="code">${escapeHtml(barcodeValue)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const printLabel = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(getPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[96vw] max-w-3xl flex-col overflow-hidden p-0" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b text-right">
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>طباعة باركود</span>
            <Badge variant="outline" className="font-mono" dir="ltr">{barcodeValue}</Badge>
          </DialogTitle>
          <DialogDescription className="text-right">
            اختر التحاليل التي ستظهر على ليبل العينة قبل الطباعة.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">معاينة الليبل</span>
              <Badge variant="outline" className="font-mono" dir="ltr">
                {formatCm(normalizedLabelSize.widthMm)} x {formatCm(normalizedLabelSize.heightMm)} cm
              </Badge>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="rounded-lg border bg-white p-3 text-black shadow-sm min-w-[260px]">
                <div
                  className="mx-auto border border-black p-2 text-[10px]"
                  dir="rtl"
                  style={{
                    width: "100%",
                    maxWidth: `${Math.min(360, normalizedLabelSize.widthMm * 4.4)}px`,
                    aspectRatio: `${normalizedLabelSize.widthMm} / ${normalizedLabelSize.heightMm}`,
                    overflow: "hidden",
                  }}
                >
                  <div className="flex items-end justify-between pb-0.5">
                    <strong className="truncate">{client.patient_name}</strong>
                    <span className="text-[8px] font-bold">{labDisplayName}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2 font-bold" dir="ltr">
                    <span className="truncate">{[patientGender, patientAge].filter(Boolean).join(" - ")}</span>
                    <span>#{client.daily_id}</span>
                  </div>
                  <div className="mt-1 text-left text-[8px] font-bold" dir="ltr">
                    Date: {sampleDateTime}
                  </div>
                  <div className="mt-1 min-h-[18px] max-h-[34px] overflow-hidden border-t border-black py-0.5 text-left text-[9px] font-bold leading-tight" dir="ltr">
                    {selectedLabels.join(", ") || "No tests selected"}
                  </div>
                  <div className="mt-1" dangerouslySetInnerHTML={{ __html: renderBarcodeSvg(barcodeValue, 42) }} />
                  <div className="text-center font-mono text-[9px] font-bold" dir="ltr">{barcodeValue}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-w-0 rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">مقاس الليبل</span>
                <Badge variant="outline" className="font-mono" dir="ltr">
                  {formatCm(normalizedLabelSize.widthMm)} x {formatCm(normalizedLabelSize.heightMm)} cm
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {LABEL_SIZE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={matchingPresetId === preset.id ? "default" : "outline"}
                    className="h-8 px-1 text-[11px] font-mono"
                    onClick={() => setLabelSize({ widthMm: preset.widthMm, heightMm: preset.heightMm })}
                  >
                    {formatCm(preset.widthMm)} x {formatCm(preset.heightMm)}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="block text-xs text-muted-foreground">العرض cm</span>
                  <Input
                    type="number"
                    min={3}
                    max={8}
                    step={0.1}
                    value={formatCm(normalizedLabelSize.widthMm)}
                    onChange={(event) => setLabelSize({ ...normalizedLabelSize, widthMm: Number(event.target.value) * 10 })}
                    className="h-8 text-center font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs text-muted-foreground">الطول cm</span>
                  <Input
                    type="number"
                    min={1.5}
                    max={8}
                    step={0.1}
                    value={formatCm(normalizedLabelSize.heightMm)}
                    onChange={(event) => setLabelSize({ ...normalizedLabelSize, heightMm: Number(event.target.value) * 10 })}
                    className="h-8 text-center font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث في التحاليل..."
                className="ps-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => setSelectionByClient((prev) => ({ ...prev, [client.uuid]: availableTests.map((test) => test.code) }))}
              >
                <Check className="h-3.5 w-3.5" />
                تحديد الكل
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5"
                onClick={() => setSelectionByClient((prev) => ({ ...prev, [client.uuid]: [] }))}
              >
                <X className="h-3.5 w-3.5" />
                مسح
              </Button>
            </div>

            <div className="max-h-[32vh] overflow-y-auto rounded-lg border sm:max-h-[36vh] lg:max-h-[300px]">
              {filteredTests.length > 0 ? filteredTests.map((test) => (
                <label key={test.code} className="flex cursor-pointer items-center gap-3 border-b px-3 py-3 last:border-b-0 hover:bg-muted/60">
                  <Checkbox checked={selectedTests.includes(test.code)} onCheckedChange={() => toggleTest(test.code)} />
                  <span className="min-w-0 flex-1 text-right">
                    <span className="block truncate text-sm font-semibold">{test.name}</span>
                    <span className="block truncate text-xs text-muted-foreground" dir="ltr">{test.code}</span>
                  </span>
                  {test.category && <Badge variant="secondary" className="text-[10px]">{test.category}</Badge>}
                </label>
              )) : (
                <div className="py-10 text-center text-sm text-muted-foreground">لا توجد تحاليل</div>
              )}
            </div>
          </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={printLabel} disabled={selectedTests.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
