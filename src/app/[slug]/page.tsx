"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  CalendarIcon,
  Download,
  Upload,
  Search,
  X,
  Loader2,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Printer,
  FileDown,
  User,
  FlaskConical,
  ChevronDown,
  Tags,
  ArrowDownUp,
  Hash,
  CalendarDays,
  StickyNote,
  Wrench,
  ClipboardList
} from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase";
import { Client, Category } from "@/types";
import { useLabContext } from "@/contexts/LabContext";
import { useLabTests } from "@/hooks/use-lab-tests";
import { fuzzyMatchArabic } from "@/lib/arabic-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientModal } from "@/components/client-modal";
import { SettingsModal } from "@/components/settings-modal";
import { TestResultsModal } from "@/components/results/test-results-modal";
import { ClientDetails } from "@/components/client-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PullToRefresh } from "@/components/pull-to-refresh";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function LabDashboard() {
  const { labId, labSlug, labName, userRole } = useLabContext();
  const { tests: labTests, loading: labTestsLoading } = useLabTests();
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsClient, setResultsClient] = useState<Client | null>(null);
  const [resultsModalInitialView, setResultsModalInitialView] = useState<"auto" | "add">("auto");
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReversed, setPrintReversed] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('printReversed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  
  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  
  // Filters - default to today
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [testFilters, setTestFilters] = useState<string[]>([]);
  const [testSearchFilter, setTestSearchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const toggleArrayValue = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  const getMultiFilterText = (count: number, emptyText: string, singularText: string, pluralText: string) => {
    if (count === 0) return emptyText;
    if (count === 1) return singularText;
    return `${count} ${pluralText}`;
  };

  const supabase = createClient();

  const filtersStorageKey = useMemo(() => {
    if (labSlug) return `lab-dashboard-filters:${labSlug}`;
    if (typeof window !== "undefined") return `lab-dashboard-filters:${window.location.pathname}`;
    return "lab-dashboard-filters";
  }, [labSlug]);

  const filteredLabTests = useMemo(() => {
    const query = testSearchFilter.trim().toLowerCase();
    if (!query) return labTests;

    return labTests.filter((test) =>
      test.test_name_ar.toLowerCase().includes(query) ||
      test.test_name_en.toLowerCase().includes(query) ||
      test.test_code.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query)
    );
  }, [labTests, testSearchFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(filtersStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          nameFilter?: string;
          categoryFilter?: string;
          testFilters?: string[];
          dateFrom?: string | null;
          dateTo?: string | null;
        };

        setNameFilter(parsed.nameFilter || "");
        setDebouncedNameFilter(parsed.nameFilter || "");
        setCategoryFilter(parsed.categoryFilter || "all");
        setTestFilters(Array.isArray(parsed.testFilters) ? parsed.testFilters : []);
        setDateFrom(parsed.dateFrom ? new Date(parsed.dateFrom) : undefined);
        setDateTo(parsed.dateTo ? new Date(parsed.dateTo) : undefined);
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    } finally {
      setFiltersHydrated(true);
    }
  }, [filtersStorageKey]);

  useEffect(() => {
    if (!filtersHydrated || typeof window === "undefined") return;

    const payload = {
      nameFilter,
      categoryFilter,
      testFilters,
      dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : null,
      dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : null,
    };

    localStorage.setItem(filtersStorageKey, JSON.stringify(payload));
  }, [filtersHydrated, filtersStorageKey, nameFilter, categoryFilter, testFilters, dateFrom, dateTo]);

  // Debounce the name filter for filtering - 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  // Save printReversed to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printReversed', JSON.stringify(printReversed));
    }
  }, [printReversed]);

  useEffect(() => {
    // Get current user id
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();

    if (labId && filtersHydrated) {
      fetchCategories();
      fetchClients();
    }
  }, [labId, filtersHydrated]); // Refetch if labId changes

  // Fetch clients when date filters change
  useEffect(() => {
    if (labId && filtersHydrated) fetchClients();
  }, [dateFrom, dateTo, labId, filtersHydrated]);

  // Refetch when debounced name filter changes (for global search)
  useEffect(() => {
    if (labId && filtersHydrated) fetchClients();
  }, [debouncedNameFilter, labId, filtersHydrated]);

  const fetchClients = async () => {
    if (!labId) return;
    setIsLoading(true);
    try {
      let allClients: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("clients")
          .select("*")
          .eq("lab_id", labId)
          .order("daily_date", { ascending: false })
          .order("primary_category", { ascending: true })
          .order("daily_id", { ascending: true })
          .range(from, from + batchSize - 1);

        // Skip date filters if user is searching by name (search all clients)
        if (!debouncedNameFilter) {
          if (dateFrom) {
            query = query.gte("daily_date", format(dateFrom, "yyyy-MM-dd"));
          }
          if (dateTo) {
            query = query.lte("daily_date", format(dateTo, "yyyy-MM-dd"));
          }
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data && data.length > 0) {
          allClients = [...allClients, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      console.log('📊 Fetched clients sample:', allClients.slice(0, 2).map((c: any) => ({
        name: c.patient_name,
        uuid: c.uuid,
        client_group_id: c.client_group_id,
        has_selected_tests: !!c.selected_tests,
        selected_tests_count: c.selected_tests?.length || 0,
        selected_tests_value: c.selected_tests,
        all_keys: Object.keys(c).filter(k => !k.startsWith('_'))
      })));

      // Extra debug: Check if ANY client has selected_tests
      const clientsWithTests = allClients.filter((c: any) => c.selected_tests && c.selected_tests.length > 0);
      console.log(`🔍 Found ${clientsWithTests.length} clients with selected_tests out of ${allClients.length} total`);

      if (clientsWithTests.length > 0) {
        console.log('✅ Clients with tests:', clientsWithTests.map((c: any) => ({
          name: c.patient_name,
          tests: c.selected_tests
        })));
      }

      setClients(allClients as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const fetchCategories = async () => {
    if (!labId) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("lab_id", labId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Deduplicate categories by id to avoid React key warnings
      const uniqueCategories = data?.filter((c, index, self) =>
        c.id && index === self.findIndex((t) => t.id === c.id)
      ) || [];
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Async filtering to prevent UI freeze
  useEffect(() => {
    setIsFiltering(true);

    // Use setTimeout to allow UI to update (show loading spinner) before heavy filtering
    const timer = setTimeout(() => {
      const results = clients.filter((client) => {
        // Name filter (client-side for Arabic fuzzy matching) - uses debounced value
        if (debouncedNameFilter && !fuzzyMatchArabic(debouncedNameFilter, client.patient_name)) {
          return false;
        }
        // Category filter
        if (categoryFilter !== "all") {
             const cats = client.categories || [];
             if (!cats.includes(categoryFilter)) return false;
        }
        // Required tests filter by selected individual tests
        if (testFilters.length > 0) {
          const selectedTests = client.selected_tests || [];
          if (!testFilters.some((testCode) => selectedTests.includes(testCode))) return false;
        }
        // Date filtering is done at database level for performance
        // But for display purposes, we might filter loaded list if needed (redundant if DB filter active)
        return true;
      });

      // Sort by: date DESC, primary_category ASC, daily_id ASC (to group categories together)
      results.sort((a, b) => {
        const dateCompare = new Date(b.daily_date).getTime() - new Date(a.daily_date).getTime();
        if (dateCompare !== 0) return dateCompare;

        const catA = (a.primary_category || (a.categories?.[0]) || '_default').toLowerCase();
        const catB = (b.primary_category || (b.categories?.[0]) || '_default').toLowerCase();
        if (catA !== catB) return catA.localeCompare(catB, 'ar');

        return a.daily_id - b.daily_id;
      });

      setFilteredClients(results);
      setIsFiltering(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [clients, debouncedNameFilter, categoryFilter, testFilters]);

  const todayClients = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return clients.filter((c) => {
        // Handle string or Date object
        const d = new Date(c.daily_date);
        return format(d, "yyyy-MM-dd") === today;
    }).length;
  }, [clients]);

  const visibleTestsCount = useMemo(() => {
    return filteredClients.reduce((total, client) => {
      return total + (Array.isArray(client.selected_tests) ? client.selected_tests.length : 0);
    }, 0);
  }, [filteredClients]);

  const visibleClients = useMemo(() => {
    const orderedClients = printReversed ? [...filteredClients].reverse() : filteredClients;
    return orderedClients.slice(0, 100);
  }, [filteredClients, printReversed]);

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("all");
    setTestFilters([]);
    setTestSearchFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = nameFilter || categoryFilter !== "all" || testFilters.length > 0 || dateFrom || dateTo;
  const useSequentialTestNumbers = testFilters.length > 0;

  const openResultsForClient = (client: Client) => {
    setResultsModalInitialView("auto");
    setResultsClient(client);
    setShowResultsModal(true);
  };

  const handleResultsSaved = (savedClientUuid: string) => {
    const currentIndex = visibleClients.findIndex((client) => client.uuid === savedClientUuid);

    if (currentIndex >= 0 && currentIndex < visibleClients.length - 1) {
      setResultsModalInitialView("auto");
      setResultsClient(visibleClients[currentIndex + 1]);
      return;
    }

    setResultsModalInitialView("auto");
    setShowResultsModal(false);
    setResultsClient(null);
  };

  const navigateResultsClient = (direction: "previous" | "next") => {
    if (!resultsClient) return;

    const currentIndex = visibleClients.findIndex((client) => client.uuid === resultsClient.uuid);
    if (currentIndex === -1) return;

    const targetIndex = direction === "previous" ? currentIndex - 1 : currentIndex + 1;
    const targetClient = visibleClients[targetIndex];

    if (!targetClient) return;

    setResultsModalInitialView("auto");
    setResultsClient(targetClient);
    setShowResultsModal(true);
  };

  const getPrintDateLabel = () => {
    if (!dateFrom) return "جميع الحالات";
    if (dateTo && format(dateFrom, "yyyy-MM-dd") === format(dateTo, "yyyy-MM-dd")) {
      return format(dateFrom, "EEEE d/M/yyyy", { locale: ar });
    }
    return `${format(dateFrom, "EEEE d/M/yyyy", { locale: ar })} ${dateTo ? `- ${format(dateTo, "EEEE d/M/yyyy", { locale: ar })}` : ""}`;
  };

  const getDisplayLabName = () => {
    const name = labName || (labSlug === "shohada" ? "الشهداء" : labSlug) || "المعمل";
    return name.startsWith("معمل") ? name : `معمل ${name}`;
  };

  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getTestLabel = (testCode: string) => {
    const test = labTests.find((item) => item.test_code === testCode);
    return test?.test_name_en || testCode;
  };

  const getDetailedPrintHtml = () => {
    type PrintableResult = {
      recorded_at?: string;
      tests?: Record<string, { value?: string | number; unit?: string }>;
    };

    const sortedData = printReversed ? [...filteredClients].reverse() : filteredClients;
    const rows = sortedData.map((client, index) => {
      const entries = Array.isArray(client.results?.entries)
        ? (client.results.entries as PrintableResult[])
        : [];
      const latestEntry = [...entries].sort(
        (a, b) => new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime()
      )[0];
      const selectedCodes = Array.isArray(client.selected_tests) ? client.selected_tests : [];
      const resultCodes = latestEntry?.tests ? Object.keys(latestEntry.tests) : [];
      const availableTestCodes = Array.from(new Set([...selectedCodes, ...resultCodes]));
      const testCodes = testFilters.length > 0
        ? availableTestCodes.filter((code) => testFilters.includes(code))
        : availableTestCodes;
      const testsHtml = testCodes.length > 0
        ? testCodes.map((code) => {
            return `<div class="test-name">${escapeHtml(getTestLabel(code))}</div>`;
          }).join("")
        : `<span class="empty-tests">No tests selected</span>`;
      const resultsHtml = testCodes.length > 0
        ? testCodes.map(() => `<div class="test-result">&nbsp;</div>`).join("")
        : `<span class="empty-tests">&nbsp;</span>`;

      return `
        <tr>
          <td class="serial">${useSequentialTestNumbers ? index + 1 : client.daily_id}</td>
          <td class="patient">${escapeHtml(client.patient_name)}</td>
          <td class="tests">${testsHtml}</td>
          <td class="results">${resultsHtml}</td>
        </tr>
      `;
    });
    const midpoint = Math.ceil(rows.length / 2);
    const columns = [rows.slice(0, midpoint), rows.slice(midpoint)];
    const renderRows = (columnRows: string[]) =>
      columnRows.join("") || `<tr><td colspan="4" style="text-align:center; padding: 20px;">لا توجد بيانات</td></tr>`;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة التحاليل والنتائج</title>
        <style>
          @font-face {
            font-family: 'Cairo';
            src: url('/assets/Cairo.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          @page { size: auto; margin: 5mm; }
          * { box-sizing: border-box; font-family: 'Cairo', sans-serif !important; }
          body { direction: rtl; background: #fff; color: #111827; padding: 5mm; font-size: 11px; line-height: 1.4; }
          .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #2563eb; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand img { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; }
          .brand h1 { font-size: 18px; color: #1e3a8a; margin: 0 0 2px; }
          .brand p, .meta p { margin: 0; color: #475569; font-size: 11px; font-weight: 600; }
          .meta { border: 1px solid #dbe3ef; background: #f8fafc; border-radius: 8px; padding: 8px 12px; min-width: 180px; }
          .meta strong { color: #2563eb; font-size: 13px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 5px; vertical-align: top; }
          th { background: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: 700; text-align: center; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          tbody tr:nth-child(even) td { background: #f8fafc; }
          .serial { width: 28px; text-align: center; font-weight: 700; }
          .patient { width: 180px; text-align: center; font-weight: 700; }
          .tests { width: auto; text-align: center; }
          .results { width: 62px; direction: ltr; text-align: center; }
          .test-name, .test-result { min-height: 20px; padding: 2px 3px; border-bottom: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: center; overflow-wrap: anywhere; }
          .test-name:last-child, .test-result:last-child { border-bottom: 0; }
          .test-name { font-weight: 700; color: #0f172a; font-size: 10px; line-height: 1.25; }
          .test-result { font-weight: 700; color: #0f172a; white-space: nowrap; }
          .empty-tests { color: #94a3b8; }
          .print-footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10px; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .details-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6mm !important; }
            th { background: #f1f5f9 !important; }
            tbody tr:nth-child(even) td { background: #f8fafc !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="brand">
            <img src="/logo.png" alt="Logo" onerror="this.style.display='none'" />
            <div>
              <h1>${escapeHtml(getDisplayLabName())}</h1>
              <p>كشف التحاليل والنتائج</p>
            </div>
          </div>
          <div class="meta">
            <p>${escapeHtml(getPrintDateLabel())}</p>
            <p>إجمالي الحالات: <strong>${filteredClients.length}</strong></p>
          </div>
        </div>

        <div class="details-grid">
          ${columns.map((columnRows) => `
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">م</th>
                  <th style="width: 180px;">الاسم</th>
                  <th>التحاليل</th>
                  <th style="width: 62px;">النتائج</th>
                </tr>
              </thead>
              <tbody>${renderRows(columnRows)}</tbody>
            </table>
          `).join("")}
        </div>

        <div class="print-footer">تم الطباعة في ${escapeHtml(format(new Date(), "EEEE d/M/yyyy - h:mm a", { locale: ar }))}</div>
      </body>
      </html>
    `;
  };

  const printDetailedResults = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(getDetailedPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // don't close — mobile needs the window open for the print dialog to appear
    }, 1000);
  };

  const handleBulkExportPDF = () => {
    type PrintableResult = {
      recorded_at?: string;
      tests?: Record<string, { value?: string | number; unit?: string; flag?: string; notes?: string }>;
      notes?: string;
    };

    const sortedClients = printReversed ? [...filteredClients].reverse() : filteredClients;

    const clientSections = sortedClients.map((client) => {
      const entries = Array.isArray(client.results?.entries)
        ? (client.results.entries as PrintableResult[])
        : [];
      const exportEntries: PrintableResult[] = [...entries].sort(
        (a, b) => new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime()
      );
      if (exportEntries.length === 0) {
        exportEntries.push({ recorded_at: new Date().toISOString(), tests: {}, notes: undefined });
      }

      const getExportTestCodes = (entryTests?: Record<string, any>) =>
        Array.from(new Set([...(client.selected_tests || []), ...Object.keys(entryTests || {})]));

      let patientHtml = `
        <div class="patient-section">
          <div class="patient-info-section">
            <table class="patient-info-table">
              <tr>
                <td class="label">Patient Name</td>
                <td class="value" style="font-weight: 700; font-size: 15px;">${escapeHtml(client.patient_name)}</td>
                <td class="label">Report ID</td>
                <td class="value" style="font-family: monospace;">${escapeHtml(String(client.daily_id))}</td>
              </tr>
              ${(client.patient_age !== undefined || client.patient_gender) ? `
                <tr>
                  <td class="label">Age</td>
                  <td class="value">${client.patient_age !== undefined && client.patient_age !== null ? escapeHtml(String(client.patient_age)) + ' Years' : '-'}</td>
                  <td class="label">Gender</td>
                  <td class="value">${client.patient_gender ? (client.patient_gender === 'male' || client.patient_gender === 'ذكر' ? 'Male' : 'Female') : '-'}</td>
                </tr>
              ` : ''}
              ${(client.insurance_number || client.entity) ? `
                <tr>
                  <td class="label">Insurance</td>
                  <td class="value">${escapeHtml(client.insurance_number || '-')}</td>
                  <td class="label">Entity</td>
                  <td class="value">${escapeHtml(client.entity || '-')}</td>
                </tr>
              ` : ''}
            </table>
          </div>
      `;

      exportEntries.forEach((entry) => {
        const testsByCategory: Record<string, Array<[string, any]>> = {};
        getExportTestCodes(entry.tests).forEach((testCode) => {
          const result = (entry.tests as Record<string, any> || {})[testCode];
          const test = labTests.find((t) => t.test_code === testCode);
          const category = test?.category || "General";
          if (!testsByCategory[category]) testsByCategory[category] = [];
          testsByCategory[category].push([testCode, result]);
        });

        const sortedCategories = Object.keys(testsByCategory).sort();

        patientHtml += `
          <div class="entry">
            <div class="entry-date">Date: ${format(new Date(entry.recorded_at || new Date()), "dd/MM/yyyy")}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 35%">Test Name</th>
                  <th style="width: 15%; text-align: center;">Result</th>
                  <th style="width: 10%; text-align: center;">Unit</th>
                  <th style="width: 20%; text-align: center;">Status</th>
                  <th style="width: 20%; text-align: center;">REF. Range</th>
                </tr>
              </thead>
              <tbody>
        `;

        sortedCategories.forEach((category, categoryIndex) => {
          patientHtml += `
            <tr>
              <td colspan="5" style="background: #f7fafc; padding: 3px 12px; font-weight: 700; color: #2d3748; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0;">
                ${escapeHtml(category)}
              </td>
            </tr>
          `;

          testsByCategory[category].forEach(([testCode, result]) => {
            const test = labTests.find((t) => t.test_code === testCode);
            const refRanges = test?.reference_ranges || {};
            const hasValidRange =
              (refRanges.default && typeof refRanges.default.min === 'number' && typeof refRanges.default.max === 'number') ||
              (refRanges.male && typeof refRanges.male.min === 'number' && typeof refRanges.male.max === 'number') ||
              (refRanges.female && typeof refRanges.female.min === 'number' && typeof refRanges.female.max === 'number') ||
              (refRanges.age_ranges && refRanges.age_ranges.length > 0 &&
                refRanges.age_ranges.some((r: any) => typeof r.min === 'number' && typeof r.max === 'number'));

            let displayRange = "-";
            if (hasValidRange) {
              const range = refRanges.default || refRanges.male || refRanges.female || refRanges.age_ranges?.[0];
              if (range && typeof range.min === 'number' && typeof range.max === 'number') {
                displayRange = `${range.min} - ${range.max}`;
              }
            }

            let flagClass = "";
            let flagLabel = "";
            if (hasValidRange && result?.flag) {
              if (["high", "low", "critical_high", "critical_low"].includes(result.flag)) flagClass = "flag-high";
              flagLabel = result.flag === "normal" ? "Normal" :
                result.flag === "high" || result.flag === "critical_high" ? "High" :
                result.flag === "low" || result.flag === "critical_low" ? "Low" : "";
            }

            patientHtml += `
              <tr>
                <td class="test-name" style="padding-left: 24px;">${escapeHtml(test?.test_name_en || test?.test_name_ar || testCode)}</td>
                <td class="result-value" style="text-align: center;">${escapeHtml(String(result?.value ?? ""))}</td>
                <td style="text-align: center; color: #718096;">${escapeHtml(result?.unit || test?.unit || "-")}</td>
                <td style="text-align: center;">${flagLabel ? `<span class="flag-badge ${flagClass}">${escapeHtml(flagLabel)}</span>` : ""}</td>
                <td style="text-align: center; font-size: 12px; color: #4a5568;">${escapeHtml(displayRange)}</td>
              </tr>
            `;
          });

          if (categoryIndex < sortedCategories.length - 1) {
            patientHtml += `<tr><td colspan="5" style="height: 12px; padding: 0;"></td></tr>`;
          }
        });

        patientHtml += `</tbody></table>`;
        if (entry.notes) {
          patientHtml += `<div class="notes-box"><strong>Comments:</strong> ${escapeHtml(entry.notes)}</div>`;
        }
        patientHtml += `</div>`;
      });

      patientHtml += `</div>`;
      return patientHtml;
    });

    const labDisplayName = labSlug ? `Laboratory ${labSlug}` : 'Medical Laboratory';
    const origin = window.location.origin;

    // Header repeated on every patient page
    const pageHeader = `
      <div class="header">
        <div class="lab-brand">
          <img src="${origin}/logo.png" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" onerror="this.style.display='none'" />
          <div class="lab-info">
            <h1>${escapeHtml(labDisplayName)}</h1>
            <p>Professional Diagnostic Services</p>
          </div>
        </div>
      </div>
    `;

    // Prepend the header into every patient section
    const sectionsWithHeader = clientSections.map((section) =>
      section.replace('<div class="patient-section">', `<div class="patient-section">${pageHeader}`)
    );

    const htmlContent = `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <title>Medical Reports - ${escapeHtml(labDisplayName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    @font-face { font-family: 'Cairo'; src: url('${origin}/assets/Cairo.ttf') format('truetype'); font-weight: 400; }
    @media print {
      @page { size: A4; margin: 1.5cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .patient-section { page-break-after: always; }
      .patient-section:last-child { page-break-after: auto; }
    }
    body { font-family: 'Inter', 'Cairo', sans-serif; line-height: 1.5; color: #1a202c; margin: 0; padding: 0; }
    .report-container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2d3748; padding-bottom: 15px; margin-bottom: 20px; }
    .lab-brand { display: flex; align-items: center; gap: 12px; }
    .lab-info h1 { margin: 0; font-size: 20px; color: #1a202c; text-transform: uppercase; letter-spacing: 0.5px; }
    .lab-info p { margin: 0; font-size: 12px; color: #718096; }
    .patient-section { margin-bottom: 30px; }
    .patient-info-section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .patient-info-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .patient-info-table td { padding: 6px 12px; border: 1px solid #e2e8f0; font-size: 12px; }
    .patient-info-table .label { background: #f8fafc; color: #718096; font-weight: 600; width: 110px; }
    .patient-info-table .value { color: #1a202c; font-weight: 500; }
    .entry { margin-bottom: 25px; }
    .entry-date { font-size: 13px; font-weight: 700; color: #2d3748; background: #edf2f7; padding: 5px 12px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 10px; }
    th { background: #2d3748; color: white; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    th:first-child { border-top-left-radius: 6px; } th:last-child { border-top-right-radius: 6px; }
    td { padding: 4px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; line-height: 1.3; }
    .test-name { font-weight: 600; color: #2d3748; }
    .result-value { font-family: monospace; font-weight: 700; font-size: 15px; }
    .flag-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .flag-normal { color: #2f855a; }
    .flag-high { background: #feebc8; color: #c05621; }
    .notes-box { background: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin-top: 10px; font-size: 13px; color: #744210; }
  </style>
</head>
<body>
  <div class="report-container">
    ${sectionsWithHeader.join("")}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
          // don't close — mobile needs window open for print dialog
        }, 500);
      };
      // load event is unreliable on mobile — use it + a fallback timeout
      printWindow.addEventListener("load", doPrint);
      setTimeout(doPrint, 2500);
    }
  };

  const handleSave = async (data: { 
    patient_name: string; 
    notes: string; 
    category: string[] | null; 
    daily_date: string; 
    daily_id?: number | null; 
    selected_tests?: string[];
    patient_gender?: string;
    insurance_number?: string;
    entity?: string;
    patient_age?: number;
  }) => {
    if (!labId) return;
    console.log('💾 handleSave called with:', {
      name: data.patient_name,
      selected_tests: data.selected_tests,
      isEdit: !!editingClient
    });
    setIsSaving(true);
    try {
      if (editingClient) {
        // EDIT: Use new update_client_group function
        // This syncs all copies in the client group and handles category changes
        const { data: result, error } = await supabase.rpc('update_client_group', {
          p_client_group_id: editingClient.client_group_id || editingClient.uuid,
          p_patient_name: data.patient_name,
          p_notes: data.notes || '',
          p_categories: data.category || [],
          p_daily_date: data.daily_date,
          p_manual_id: data.daily_id ?? null,
          p_selected_tests: data.selected_tests || [],
          p_patient_gender: data.patient_gender || 'ذكر',
          p_insurance_number: data.insurance_number ?? null,
          p_entity: data.entity ?? null,
          p_patient_age: data.patient_age ?? null
        });

        if (error) throw error;

        console.log('✅ Client updated with selected_tests:', data.selected_tests?.length || 0, 'tests');
      } else {
        // ADD: Use new insert_client_multi_category function
        // This creates one record per category, all sharing the same client_group_id
        const { data: result, error } = await supabase.rpc('insert_client_multi_category', {
          p_lab_id: labId,
          p_patient_name: data.patient_name,
          p_notes: data.notes || '',
          p_categories: data.category || [],
          p_daily_date: data.daily_date,
          p_manual_id: data.daily_id ?? null,
          p_created_by: currentUserId,
          p_selected_tests: data.selected_tests || [],
          p_patient_gender: data.patient_gender || 'ذكر',
          p_insurance_number: data.insurance_number ?? null,
          p_entity: data.entity ?? null,
          p_patient_age: data.patient_age ?? null
        });

        if (error) throw error;

        console.log('✅ Client created with selected_tests:', data.selected_tests?.length || 0, 'tests');
      }

      await fetchClients();

      if (editingClient) {
        setShowAddModal(false);
        setEditingClient(null);
      }
      // If adding new, keep modal open for rapid entry
    } catch (error) {
      console.error("Error saving client:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete each client using the RPC function to handle resequencing
      for (const uuid of selectedIds) {
        const { error } = await supabase.rpc('delete_client_single_category', {
          p_uuid: uuid
        });
        if (error) throw error;
      }

      await fetchClients();
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);

    } catch (error) {
      console.error("Error deleting clients:", error);
      alert("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteClient) return;
    setIsDeleting(true);
    try {
      // Use new delete_client_single_category function
      // This deletes only the current category copy and resequences
      const { error } = await supabase.rpc('delete_client_single_category', {
        p_uuid: deleteClient.uuid
      });

      if (error) throw error;

      await fetchClients();
      setDeleteClient(null);
    } catch (e) {
      console.error(e);
      alert("Error deleting");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredClients.map(c => c.uuid || "").filter(id => id !== "");
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (uuid: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, uuid]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== uuid));
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filteredClients.map((client, index) => ({
        "#": index + 1,
        "الرقم اليومي": client.daily_id,
        "التاريخ": format(new Date(client.daily_date), "yyyy-MM-dd"),
        "الاسم": client.patient_name,
        "التصنيف": (client.categories || []).join(", "),
        "الملاحظات": client.notes || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "العملاء");
      
      const filename = `clients_${labSlug || 'lab'}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error(error);
      alert("Error exporting");
    } finally {
        setIsExporting(false);
    }
  };
  
  const importFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (jsonData.length === 0) {
        alert("الملف فارغ");
        return;
      }

      const importedClients = jsonData.map((row) => {
        const dailyId = row["id"] || row["daily_id"] || row["الرقم اليومي"] || row["رقم"];
        const dateValue = row["date"] || row["client_date"] || row["daily_date"] || row["التاريخ"] || row["تاريخ"];
        const name = row["name"] || row["patient_name"] || row["الاسم"] || row["اسم"];
        const notes = row["notes"] || row["الملاحظات"] || row["ملاحظات"] || "";
        const categoryRaw = row["category"] || row["categories"] || row["التصنيف"] || null;

        // Get valid category names from the lab
        const validCategoryNames = new Set(categories.map(c => c.name));

        let categoryVal: string[] = [];
        if (categoryRaw) {
           const catStr = String(categoryRaw).trim();
           categoryVal = catStr.split(/,|،/).map(s => s.trim()).filter(Boolean);
        }

        // Filter out invalid/dummy category values and replace with "عام"
        // Invalid values: -, ص.م, _, null, empty strings, or any category not in the lab
        const dummyCategories = ['-', 'ص.م', '_', '.', 'null', 'N/A', 'NA'];
        categoryVal = categoryVal.filter(cat =>
          cat && !dummyCategories.includes(cat) && validCategoryNames.has(cat)
        );

        // Default to "عام" if no valid categories remain
        if (categoryVal.length === 0) {
          categoryVal = ['عام'];
        }

        let clientDate: string;
        if (typeof dateValue === "number") {
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
          clientDate = format(excelDate, "yyyy-MM-dd");
        } else if (typeof dateValue === "string") {
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            clientDate = format(parsedDate, "yyyy-MM-dd");
          } else {
            clientDate = format(new Date(), "yyyy-MM-dd");
          }
        } else {
          clientDate = format(new Date(), "yyyy-MM-dd");
        }

        if (!name) return null;

        return {
          lab_id: labId,
          patient_name: String(name).trim(),
          notes: notes ? String(notes).trim() : null,
          categories: categoryVal,
          daily_date: clientDate,
          created_by: currentUserId,
          // daily_id: handled by DB trigger typically
        };
      }).filter(Boolean);

      if (importedClients.length === 0) {
        alert("لم يتم العثور على بيانات صالحة");
        return;
      }

      // For imports, use the direct insert method (much faster)
      // We'll let the database trigger handle daily_id assignment
      // The trigger already handles conflicts by shifting IDs
      const { error } = await supabase
        .from("clients")
        .insert(importedClients);

      if (error) {
        console.error("Error importing:", error);
        alert(`حدث خطأ أثناء الاستيراد: ${error.message || 'Unknown error'}`);
      } else {
        await fetchClients();
        alert(`تم استيراد ${importedClients.length} حالة بنجاح`);
      }
    } catch (error) {
      console.error("Error importing:", error);
      alert("حدث خطأ أثناء الاستيراد");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = `/${labSlug}/login`;
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={fetchClients}>
    <main className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-xl"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <div>
                <h1 className="text-lg font-bold">{getDisplayLabName()}</h1>
                <p className="text-xs text-muted-foreground">
                  {todayClients} حالة اليوم • {clients.length} إجمالي
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
               {(userRole === 'lab_admin') && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setShowSettings(true)}
                >
                   <Settings className="h-4 w-4" />
                </Button>
               )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Filters */}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.35fr)_minmax(160px,0.9fr)_minmax(240px,1.1fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)] gap-3 xl:items-end">

                {/* الاسم */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    الاسم
                  </Label>
                  <div className="relative">
                    <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="h-10 ps-8"
                    />
                  </div>
                </div>

                {/* التصنيف */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tags className="h-3.5 w-3.5" />
                    التصنيف
                  </Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 w-full text-right">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* التحاليل المطلوبة — full width on mobile */}
                <div className="space-y-1.5 col-span-2 xl:col-span-1">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <FlaskConical className="h-3.5 w-3.5" />
                    التحاليل المطلوبة
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-between gap-2 px-3 font-normal"
                        disabled={labTestsLoading || labTests.length === 0}
                      >
                        <span className={cn("truncate", testFilters.length === 0 && "text-muted-foreground")}>
                          {labTestsLoading
                            ? "جاري التحميل..."
                            : labTests.length === 0
                              ? "لا توجد تحاليل"
                              : getMultiFilterText(testFilters.length, "كل التحاليل", "تحليل واحد", "تحاليل")}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      avoidCollisions={true}
                      collisionPadding={12}
                      className="w-[min(320px,calc(100vw-1.5rem))] p-2"
                    >
                      <div className="relative mb-2">
                        <Search className="absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={testSearchFilter}
                          onChange={(e) => setTestSearchFilter(e.target.value)}
                          placeholder="بحث في التحاليل..."
                          className="h-9 ps-8"
                        />
                      </div>
                      <div className="max-h-[35vh] sm:max-h-64 space-y-1 overflow-y-auto overscroll-contain">
                        {filteredLabTests.length > 0 ? filteredLabTests.map((test) => (
                          <label
                            key={test.uuid}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 text-sm hover:bg-muted active:bg-muted"
                          >
                            <Checkbox
                              checked={testFilters.includes(test.test_code)}
                              onCheckedChange={() => setTestFilters((prev) => toggleArrayValue(prev, test.test_code))}
                            />
                            <span className="min-w-0 flex-1 truncate">{test.test_name_en}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{test.category}</span>
                          </label>
                        )) : (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            لا توجد تحاليل مطابقة
                          </div>
                        )}
                      </div>
                      {(testFilters.length > 0 || testSearchFilter) && (
                        <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setTestSearchFilter("")}
                          >
                            مسح البحث
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setTestFilters([])}
                            disabled={testFilters.length === 0}
                          >
                            مسح التحاليل
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* من تاريخ */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    من تاريخ
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 w-full justify-start font-normal text-sm",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "d/M/yyyy") : "اختر"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* إلى تاريخ */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    إلى تاريخ
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-10 w-full justify-start font-normal text-sm",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "d/M/yyyy") : "اختر"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        locale={ar}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

            </div>
          </CardContent>
        </Card>

        {/* Results count and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: stats + sort */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="gap-1 h-7 px-2 text-xs">
              <ClipboardList className="h-3 w-3" />
              {filteredClients.length} نتيجة
            </Badge>
            <Badge variant="outline" className="gap-1 h-7 px-2 text-xs">
              <FlaskConical className="h-3 w-3" />
              {visibleTestsCount} تحليل
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrintReversed(!printReversed)}
              className="h-7 gap-1 px-2 text-xs"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              {printReversed ? '↑ تصاعدي' : '↓ تنازلي'}
            </Button>
            {(isLoading || isFiltering) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {/* Hidden file input for import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={importFromFile}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              disabled={isImporting}
              className="h-8 gap-1.5 px-2.5 text-xs"
            >
              {isImporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">استيراد</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={isExporting || filteredClients.length === 0}
              className="h-8 gap-1.5 px-2.5 text-xs"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">تصدير</span>
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="h-8 gap-1.5 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>({selectedIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
              disabled={filteredClients.length === 0}
              className="h-8 gap-1.5 px-2.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="w-[50px] min-w-[50px] text-center text-muted-foreground/50">
                        <Checkbox 
                          checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Select all"
                          className="mx-auto"
                        />
                      </TableHead>
                      <TableHead className="w-14 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Hash className="h-3.5 w-3.5" />
                          م
                        </span>
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          التاريخ
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="flex items-center justify-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          الاسم
                        </span>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Tags className="h-3.5 w-3.5" />
                          التصنيف
                        </span>
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-center">
                        <span className="flex items-center justify-center gap-1">
                          <StickyNote className="h-3.5 w-3.5" />
                          ملاحظات
                        </span>
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Wrench className="h-3.5 w-3.5" />
                          إجراءات
                        </span>
                      </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {hasFilters ? "لا يوجد نتائج" : "لا يوجد بيانات"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                    {visibleClients.map((client, index) => (
                      <TableRow 
                        key={client.uuid} 
                        data-state={selectedIds.includes(client.uuid || "") ? "selected" : undefined}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={(e) => {
                          // Prevent opening details when clicking checkbox or actions
                          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) {
                            return;
                          }
                          setDetailsClient(client);
                          setShowDetailsSheet(true);
                        }}
                      >
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={!!client.uuid && selectedIds.includes(client.uuid)}
                              onCheckedChange={(checked) => handleSelectRow(client.uuid || "", checked as boolean)}
                              className="mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {useSequentialTestNumbers ? index + 1 : client.daily_id}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(client.daily_date)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{client.patient_name}</div>
                             <div className="sm:hidden text-xs text-muted-foreground">
                               {client.categories && client.categories.filter(c => c !== 'عام').map((cat, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5 ms-1">
                                    {cat}
                                  </Badge>
                               ))}
                             </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {client.categories?.filter(c => c !== 'عام').map((cat, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {cat}
                                    </Badge>
                                ))}
                              </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate text-center">
                              {client.notes || "-"}
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                  {(() => {
                                    const hasTests = client.selected_tests && client.selected_tests.length > 0;

                                    // Debug: Only log if client has selected_tests field (to reduce noise)
                                    if (client.selected_tests !== undefined) {
                                      console.log('🔎 Client with selected_tests field:', {
                                        name: client.patient_name,
                                        selected_tests: client.selected_tests,
                                        hasTests: hasTests,
                                        isArray: Array.isArray(client.selected_tests),
                                        length: client.selected_tests?.length
                                      });
                                    }

                                    if (hasTests) {
                                      console.log('✅ FLASK RENDERED for:', client.patient_name);
                                    }
                                    return hasTests ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary"
                                        onClick={() => openResultsForClient(client)}
                                        title="إضافة نتائج التحاليل"
                                      >
                                        <FlaskConical className="h-4 w-4" />
                                      </Button>
                                    ) : null;
                                  })()}
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                      setEditingClient(client);
                                      setShowAddModal(true);
                                  }}>
                                      <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteClient(client)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </TableCell>
                      </TableRow>
                    ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
    </PullToRefresh>

    {/* Floating Action Button */}
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50">
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg"
        onClick={() => {
          setEditingClient(null);
          setShowAddModal(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>

    {/* Modals */}
    <ClientModal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      onSave={handleSave}
      client={editingClient}
      categories={categories}
      isLoading={isSaving}
    />
    
    <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                    سيتم حذف حالة "{deleteClient?.patient_name}" نهائياً.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? "جاري الحذف..." : "حذف"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من حذف الحالات المحددة؟</AlertDialogTitle>
                <AlertDialogDescription>
                    سيتم حذف {selectedIds.length} حالة نهائياً. لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    {isBulkDeleting ? "جاري الحذف..." : "حذف المحدد"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <SettingsModal
         isOpen={showSettings}
         onClose={() => setShowSettings(false)}
         categories={categories}
         onCategoriesChange={fetchCategories}
    />

    {/* Test Results Modal */}
    {resultsClient && (
      (() => {
        const currentIndex = visibleClients.findIndex((client) => client.uuid === resultsClient.uuid);
        const hasPrevious = currentIndex > 0;
        const hasNext = currentIndex >= 0 && currentIndex < visibleClients.length - 1;
        const clientPosition = currentIndex >= 0 ? currentIndex + 1 : undefined;

        return (
      <TestResultsModal
        isOpen={showResultsModal}
        onClose={() => {
          setResultsModalInitialView("auto");
          setShowResultsModal(false);
          setResultsClient(null);
        }}
        onSaveSuccess={handleResultsSaved}
        onNavigatePrevious={() => navigateResultsClient("previous")}
        onNavigateNext={() => navigateResultsClient("next")}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        clientPosition={clientPosition}
        totalClients={visibleClients.length}
        initialViewMode={resultsModalInitialView}
        clientUuid={resultsClient.uuid}
        clientName={resultsClient.patient_name}
        clientGender={resultsClient.patient_gender}
        clientAge={resultsClient.patient_age}
      />
        );
      })()
    )}

    <ClientDetails
      client={detailsClient}
      isOpen={showDetailsSheet}
      onClose={() => {
        setShowDetailsSheet(false);
        setDetailsClient(null);
      }}
      onEdit={(client) => {
        setShowDetailsSheet(false);
        setEditingClient(client);
        setShowAddModal(true);
      }}
    />
    
    {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">استيراد البيانات</DialogTitle>
            <DialogDescription className="text-right">
              يرجى التأكد من أن ملف Excel يتبع الصيغة المطلوبة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">صيغة الملف المطلوبة:</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-right border-b">اسم العمود</th>
                      <th className="py-2 px-3 text-right border-b">مطلوب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">الاسم</td>
                      <td className="py-2 px-3"><Badge variant="destructive" className="text-[10px]">مطلوب</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">التاريخ</td>
                      <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px]">اختياري</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                • يدعم Excel (.xlsx, .xls) و CSV
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowImportModal(false);
                }}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? "جاري الاستيراد..." : "اختر ملف للاستيراد"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:h-[85vh] p-0 rounded-xl overflow-hidden flex flex-col" dir="rtl" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b bg-background">
            <div className="flex items-center justify-between gap-3 w-full">
              {/* Title */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold leading-tight">معاينة الطباعة</DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs font-medium truncate">
                  {filteredClients.length} حالة | {getPrintDateLabel()}
                </DialogDescription>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  onClick={handleBulkExportPDF}
                  size="sm"
                  variant="outline"
                  disabled={filteredClients.length === 0}
                  className="gap-1.5 h-8 px-2.5 text-xs font-semibold"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline sm:inline">تصدير التحاليل</span>
                </Button>
                <Button
                  onClick={printDetailedResults}
                  size="sm"
                  variant="outline"
                  disabled={filteredClients.length === 0}
                  className="gap-1.5 h-8 px-2.5 text-xs font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">طباعة بالنتائج</span>
                </Button>
                <Button
                  onClick={() => {
                    const printContent = document.getElementById('print-content');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html dir="rtl" lang="ar">
                          <head>
                            <meta charset="UTF-8">
                            <title>حالات المعمل - PDF</title>
                            <style>
                              @font-face {
                                font-family: 'Cairo';
                                src: url('/assets/Cairo.ttf') format('truetype');
                                font-weight: 400; font-style: normal;
                              }
                              @page { size: auto; margin: 5mm; }
                              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif !important; font-weight: 500 !important; }
                              body { font-size: 13px; line-height: 1.5; color: #111; direction: rtl; background: #fff; padding: 5mm; }
                              .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #2563eb; }
                              .print-header-right { display: flex; align-items: center; gap: 15px; }
                              .print-logo { width: 70px; height: 70px; border-radius: 8px; object-fit: contain; }
                              .print-header-text h1 { font-size: 22px; font-weight: 700; color: #1e3a8a; margin-bottom: 5px; }
                              .print-header-text p { font-size: 14px; color: #475569; }
                              .print-header-left { background-color: #f8fafc; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: right; }
                              .print-header-left p { font-size: 14px; color: #334155; margin-bottom: 5px; font-weight: 700; }
                              .print-header-left span { color: #2563eb; font-weight: 700; font-size: 16px; }
                              .print-tables-container { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; align-items: start; }
                              table { width: 100%; border-collapse: collapse; font-size: 13px; }
                              th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: center; }
                              th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; font-size: 14px; }
                              td { color: #1e293b; font-weight: 500; }
                              tr { break-inside: avoid; }
                              tr:nth-child(even) td { background-color: #f8fafc; }
                              .print-footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                              @media print {
                                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                                .print-header-left { background-color: #f8fafc !important; }
                                .print-tables-container { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8mm !important; }
                                th { background-color: #f1f5f9 !important; }
                                tr:nth-child(even) td { background-color: #f8fafc !important; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                          </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          alert('لحفظ كـ PDF: اختر "حفظ كـ PDF" أو "Save as PDF" في خيارات الطابعة');
                          printWindow.print();
                        }, 300);
                      }
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 px-2.5 text-xs font-semibold"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowPrintModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/30 p-0 sm:p-6">
            <style dangerouslySetInnerHTML={{ __html: `
              @font-face {
                font-family: 'Cairo';
                src: url('/assets/Cairo.ttf') format('truetype');
                font-weight: 400; font-style: normal;
              }
            `}} />
            <div 
              id="print-content"
              className="bg-white mx-auto shadow-sm sm:shadow-lg border sm:rounded-md"
              style={{ width: '100%', minWidth: 'auto', maxWidth: '210mm', minHeight: '297mm', padding: '8mm', fontFamily: "'Cairo', sans-serif", fontWeight: '500' }}
            >
              <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '3px solid #2563eb' }}>
                <div className="print-header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src="/logo.png" alt="Logo" className="print-logo" style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                  <div className="print-header-text">
                    <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a8a', marginBottom: '5px' }}>{getDisplayLabName()}</h1>
                    <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>سجل الحالات اليومية</p>
                  </div>
                </div>
                <div className="print-header-left" style={{ backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', color: '#334155', marginBottom: '5px', fontWeight: '600' }}>
                    {getPrintDateLabel()}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                    إجمالي الحالات: <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '16px' }}>{filteredClients.length}</span> حالة
                  </p>
                </div>
              </div>

              <div className="print-tables-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', alignItems: 'start' }}>
                {(() => {
                  const sortedData = printReversed ? [...filteredClients].reverse() : filteredClients;
                  const numberedRows = sortedData.map((client, index) => ({
                    client,
                    number: useSequentialTestNumbers ? index + 1 : client.daily_id,
                  }));
                  const midpoint = Math.ceil(numberedRows.length / 2);
                  const columns = [numberedRows.slice(0, midpoint), numberedRows.slice(midpoint)];
                  
                  return (
                    <>
                      {columns.map((rows, columnIndex) => (
                        <table key={columnIndex} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ breakInside: 'avoid', borderBottom: '2px solid #cbd5e1' }}>
                              <th style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'center', fontWeight: '700', color: '#0f172a', fontSize: '14px', width: '35px' }}>م</th>
                              <th style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'center', fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>الاسم</th>
                              <th style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'center', fontWeight: '700', color: '#0f172a', fontSize: '14px', width: '90px' }}>الاستلام</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(({ client, number }, idx) => (
                              <tr key={client.uuid} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', breakInside: 'avoid' }}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'center', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{number}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'center', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{client.patient_name}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        ))}
                    </>
                  );
                })()}
              </div>

              <div className="print-footer" style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                تم الطباعة في {format(new Date(), "EEEE d/M/yyyy - h:mm a", { locale: ar })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
