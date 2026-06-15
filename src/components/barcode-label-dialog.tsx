"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Printer, Search, X } from "lucide-react";
import { Client } from "@/types";
import { useLabContext } from "@/contexts/LabContext";
import { useLabTests } from "@/hooks/use-lab-tests";
import { getLabDisplayName } from "@/lib/lab-display-name";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const EDITA_TERMS = ["cbc", "hba1c", "abo", "film"];
const CTREAT_TERMS = ["pt", "ptt", "esr"];
const GROUP_EXCLUDE_TERMS = [...EDITA_TERMS, ...CTREAT_TERMS];
const normalizeMatch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const clampLabelDimension = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const normalizeLabelSize = (size: LabelSize): LabelSize => ({
  widthMm: clampLabelDimension(Math.round(size.widthMm), 30, 80),
  heightMm: clampLabelDimension(Math.round(size.heightMm), 15, 80),
});

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roundCss = (value: number) => Number(value.toFixed(2));

const getLabelMetrics = (size: LabelSize) => {
  const { widthMm, heightMm } = normalizeLabelSize(size);
  const widthScale = widthMm / DEFAULT_LABEL_SIZE.widthMm;
  const heightScale = heightMm / DEFAULT_LABEL_SIZE.heightMm;
  const scale = clampNumber(Math.sqrt(widthScale * heightScale), 0.68, 1.65);
  const compact = widthMm <= 50 || heightMm <= 25;

  const marginMm = roundCss(clampNumber(heightMm * 0.028, 0.35, 1.2));
  const paddingX = roundCss(clampNumber(widthMm * 0.032, 0.75, 2.6));
  const paddingY = roundCss(clampNumber(heightMm * 0.036, 0.45, 1.8));
  const gapMm = roundCss(clampNumber(heightMm * 0.018, 0.18, 0.75));
  const testsHeight = roundCss(clampNumber(heightMm * 0.22, 3.2, 10));

  return {
    marginMm,
    paddingX,
    paddingY,
    gapMm,
    topGapMm: roundCss(clampNumber(widthMm * 0.026, 0.8, 2.5)),
    nameFont: roundCss(clampNumber(8.2 * scale, 6.8, 13.5)),
    labFont: roundCss(clampNumber(5.7 * scale, 4.6, 9.4)),
    metaFont: roundCss(clampNumber(5.2 * scale, 4.2, 8)),
    testsFont: roundCss(clampNumber(5.2 * scale, 4.2, 8)),
    codeFont: roundCss(clampNumber(6 * scale, 4.8, 9.7)),
    testsHeight,
    barcodeWidth: roundCss(Math.max(16, (widthMm - (paddingX * 2)) * 0.82)),
    barcodeHeight: roundCss(clampNumber(
      heightMm - (paddingY * 2) - testsHeight - (gapMm * 3) - (compact ? 8.8 : 10.5),
      4,
      heightMm * 0.22
    )),
  };
};

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

  return `<svg class="barcode-svg" style="width:100%;height:100%;display:block;" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

export function BarcodeLabelDialog({ client, isOpen, onClose }: BarcodeLabelDialogProps) {
  const { labName, labSlug } = useLabContext();
  const { tests } = useLabTests();
  const [selectionByClient, setSelectionByClient] = useState<Record<string, string[]>>({});
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
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
  const labelMetrics = getLabelMetrics(normalizedLabelSize);
  const matchingPresetId = LABEL_SIZE_PRESETS.find(
    (preset) => preset.widthMm === normalizedLabelSize.widthMm && preset.heightMm === normalizedLabelSize.heightMm
  )?.id;
  const labDisplayName = getLabDisplayName(labName, labSlug);
  const barcodeValue = sanitizeBarcodeValue(`${client.daily_id}-${client.uuid.slice(0, 8).toUpperCase()}`);
  const patientGender = client.patient_gender
    ? (client.patient_gender === "male" || client.patient_gender === "ذكر" ? "M" : "F")
    : "";
  const patientAge = typeof client.patient_age === "number" ? `${client.patient_age}Y` : "";
  const sampleDateTime = format(new Date(client.created_at || client.daily_date), "yyyy-MM-dd h:mm a");
  const selectedLabels = selectedTests.map((code) => {
    const test = availableTests.find((item) => item.code === code);
    return test?.name || code;
  });

  const testMatchesAny = (test: { code: string; name: string }, terms: string[]) => {
    const code = normalizeMatch(test.code);
    const name = normalizeMatch(test.name);
    return terms.some((term) => code.includes(term) || name.includes(term));
  };

  const groups = [
    { id: "edita", label: "EDITA", codes: availableTests.filter((t) => testMatchesAny(t, EDITA_TERMS)).map((t) => t.code) },
    { id: "ctreat", label: "CTREAT", codes: availableTests.filter((t) => testMatchesAny(t, CTREAT_TERMS)).map((t) => t.code) },
    { id: "serum", label: "SERUM", codes: availableTests.filter((t) => !testMatchesAny(t, GROUP_EXCLUDE_TERMS)).map((t) => t.code) },
  ];

  const getGroupCodes = (id: string) => groups.find((g) => g.id === id)?.codes || [];
  const codesToText = (codes: string[]) => {
    const names = codes.map((code) => availableTests.find((t) => t.code === code)?.name || code);
    return names.length > 0 ? names.join(", ") : "No tests selected";
  };

  const toggleGroup = (id: string) => {
    const next = activeGroups.includes(id) ? activeGroups.filter((x) => x !== id) : [...activeGroups, id];
    setActiveGroups(next);
    const unionCodes = Array.from(new Set(next.flatMap((gid) => getGroupCodes(gid))));
    setSelectionByClient((prev) => ({
      ...prev,
      [client.uuid]: unionCodes.length > 0 ? unionCodes : (client.selected_tests || []),
    }));
  };

  const quickPrintGroup = (id: string) => {
    const codes = getGroupCodes(id);
    if (codes.length === 0) return;
    printPages([codesToText(codes)]);
  };

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

  const getPrintHtml = (testsTextPages: string[]) => {
    const widthMm = normalizedLabelSize.widthMm;
    const heightMm = normalizedLabelSize.heightMm;
    const metrics = getLabelMetrics(normalizedLabelSize);

    const renderLabel = (testsText: string) => `
  <div class="label">
    <div class="name">${escapeHtml(client.patient_name)}</div>
    <div class="meta">
      <span class="lab">${escapeHtml(labDisplayName)}</span>
      <span>#${escapeHtml(String(client.daily_id))}</span>
    </div>
    <div class="meta">
      <span>${escapeHtml([patientGender, patientAge].filter(Boolean).join(" - "))}</span>
      <span>${escapeHtml(sampleDateTime)}</span>
    </div>
    <div class="tests">${escapeHtml(testsText)}</div>
    <div class="barcode-wrap">
      <div>
        ${renderBarcodeSvg(barcodeValue)}
        <div class="code">${escapeHtml(barcodeValue)}</div>
      </div>
    </div>
  </div>`;

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>Barcode Label - ${escapeHtml(client.patient_name)}</title>
  <style>
    @font-face { font-family: 'Cairo'; src: url('/assets/Cairo.ttf') format('truetype'); font-weight: 200 1000; }
    @font-face { font-family: 'Qatar Bold'; src: url('/assets/Qatar-Bold.ttf') format('truetype'); font-weight: 100 900; }
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${widthMm}mm;
      background: #fff;
      color: #000;
      font-family: Arial, 'Cairo', sans-serif;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .label {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      padding: ${metrics.paddingY}mm ${metrics.paddingX}mm;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto auto auto minmax(${metrics.testsHeight}mm, auto) minmax(0, 1fr);
      gap: ${metrics.gapMm}mm;
      break-after: page;
      page-break-after: always;
    }
    .label:last-child { break-after: auto; page-break-after: auto; }
    .name {
      font-family: 'Qatar Bold', 'Cairo', Arial, sans-serif;
      font-size: ${metrics.nameFont}px;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-bottom: ${metrics.gapMm / 2}mm;
    }
    .lab { font-weight: 700; white-space: nowrap; }
    .meta {
      direction: ltr;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${metrics.topGapMm}mm;
      font-size: ${metrics.metaFont}px;
      font-weight: 800;
      line-height: 1;
    }
    .tests {
      direction: ltr;
      text-align: left;
      font-size: ${metrics.testsFont}px;
      font-weight: 800;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
      border-top: 0.2mm solid #000;
      padding: ${metrics.gapMm / 2}mm 0;
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
      width: ${metrics.barcodeWidth}mm;
      height: ${metrics.barcodeHeight}mm;
      display: block;
      fill: #000;
      shape-rendering: crispEdges;
    }
    .code {
      direction: ltr;
      font-size: ${metrics.codeFont}px;
      font-weight: 800;
      font-family: Arial, sans-serif;
      letter-spacing: 0;
      text-align: center;
      line-height: 1;
      margin-top: ${metrics.gapMm / 2}mm;
    }
    @media print {
      html, body { width: ${widthMm}mm; overflow: hidden; }
      .label { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
${testsTextPages.map((page) => renderLabel(page)).join("\n")}
</body>
</html>`;
  };

  const printPages = (testsTextPages: string[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(getPrintHtml(testsTextPages));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const printLabel = () => {
    const pages = activeGroups.length > 0
      ? activeGroups.map((id) => codesToText(getGroupCodes(id)))
      : [selectedLabels.length > 0 ? selectedLabels.join(", ") : "No tests selected"];
    printPages(pages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <style dangerouslySetInnerHTML={{ __html: `@font-face { font-family: 'Qatar Bold'; src: url('/assets/Qatar-Bold.ttf') format('truetype'); font-weight: 100 900; }` }} />
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
                  className="mx-auto text-black"
                  dir="rtl"
                  style={{
                    width: "100%",
                    maxWidth: `${Math.min(360, normalizedLabelSize.widthMm * 4.4)}px`,
                    aspectRatio: `${normalizedLabelSize.widthMm} / ${normalizedLabelSize.heightMm}`,
                    display: "grid",
                    gridTemplateRows: `auto auto auto minmax(${labelMetrics.testsHeight}mm, auto) minmax(0, 1fr)`,
                    gap: `${labelMetrics.gapMm}mm`,
                    overflow: "hidden",
                    padding: `${labelMetrics.paddingY}mm ${labelMetrics.paddingX}mm`,
                  }}
                >
                  <strong
                    className="block truncate text-center leading-tight"
                    style={{
                      fontFamily: "'Qatar Bold', 'Cairo', sans-serif",
                      fontSize: `${labelMetrics.nameFont}px`,
                      fontWeight: 700,
                      paddingBottom: `${labelMetrics.gapMm / 2}mm`,
                    }}
                  >
                    {client.patient_name}
                  </strong>
                  <div
                    className="flex items-center justify-between font-extrabold leading-none"
                    dir="ltr"
                    style={{ gap: `${labelMetrics.topGapMm}mm`, fontSize: `${labelMetrics.metaFont}px` }}
                  >
                    <span className="truncate font-bold">{labDisplayName}</span>
                    <span>#{client.daily_id}</span>
                  </div>
                  <div
                    className="flex items-center justify-between font-extrabold leading-none"
                    dir="ltr"
                    style={{ gap: `${labelMetrics.topGapMm}mm`, fontSize: `${labelMetrics.metaFont}px` }}
                  >
                    <span className="truncate">{[patientGender, patientAge].filter(Boolean).join(" - ")}</span>
                    <span>{sampleDateTime}</span>
                  </div>
                  <div
                    className="overflow-hidden border-t border-black text-left font-extrabold leading-tight"
                    dir="ltr"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      padding: `${labelMetrics.gapMm / 2}mm 0`,
                      fontSize: `${labelMetrics.testsFont}px`,
                      lineHeight: 1.2,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {selectedLabels.join(", ") || "No tests selected"}
                  </div>
                  <div className="flex min-h-0 items-center justify-center overflow-hidden" dir="ltr">
                    <div>
                      <div
                        dangerouslySetInnerHTML={{ __html: renderBarcodeSvg(barcodeValue) }}
                        style={{
                          width: `${labelMetrics.barcodeWidth}mm`,
                          height: `${labelMetrics.barcodeHeight}mm`,
                        }}
                      />
                      <div
                        className="text-center font-mono font-extrabold leading-none"
                        dir="ltr"
                        style={{ fontSize: `${labelMetrics.codeFont}px`, marginTop: `${labelMetrics.gapMm / 2}mm` }}
                      >
                        {barcodeValue}
                      </div>
                    </div>
                  </div>
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

          <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">مجموعات سريعة</span>
              <span className="text-[11px] text-muted-foreground">حدد للمجموعات ثم اطبع، أو اضغط المجموعة لطباعتها فوراً</span>
            </div>
            <div className="space-y-2">
              {groups.map((g) => {
                const active = activeGroups.includes(g.id);
                const disabled = g.codes.length === 0;
                return (
                  <div key={g.id} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 flex-1 justify-start gap-2"
                      onClick={() => quickPrintGroup(g.id)}
                      disabled={disabled}
                      title={disabled ? "لا توجد تحاليل مطابقة" : `طباعة ${g.label} فوراً`}
                    >
                      <Printer className="h-4 w-4 shrink-0" />
                      <span className="font-bold tracking-wide">{g.label}</span>
                      <span className="ms-auto text-[11px] text-muted-foreground">{g.codes.length} تحاليل</span>
                    </Button>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleGroup(g.id)}
                      disabled={disabled}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground hover:bg-muted"
                      )}
                      title={active ? "إلغاء تحديد المجموعة" : "تحديد المجموعة للطباعة المتعددة"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={printLabel} disabled={activeGroups.length === 0 && selectedTests.length === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            {activeGroups.length > 1 ? `طباعة (${activeGroups.length} صفحات)` : "طباعة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
