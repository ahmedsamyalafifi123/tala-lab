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
  FileDown
} from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase";
import { Client, Category } from "@/types";
import { useLabContext } from "@/contexts/LabContext";
import { fuzzyMatchArabic } from "@/lib/arabic-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientModal } from "@/components/client-modal";
import { SettingsModal } from "@/components/settings-modal";
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
  const { labId, labSlug } = useLabContext();
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
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReversed, setPrintReversed] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  
  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Filters - default to today
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  const supabase = createClient();

  // Debounce the name filter for filtering - 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  useEffect(() => {
    // Get current user id
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();

    if (labId) {
      fetchCategories();
      fetchClients();
    }
  }, [labId]); // Refetch if labId changes

  // Fetch clients when date filters change
  useEffect(() => {
    if (labId) fetchClients();
  }, [dateFrom, dateTo, labId]);

  // Refetch when debounced name filter changes (for global search)
  useEffect(() => {
    if (labId) fetchClients();
  }, [debouncedNameFilter]);

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
          .order("daily_id", { ascending: false })
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
      setCategories(data || []);
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
             if (categoryFilter === "none") {
                 if (cats.length > 0) return false;
             } else {
                 if (!cats.includes(categoryFilter)) return false;
             }
        }
        // Date filtering is done at database level for performance
        // But for display purposes, we might filter loaded list if needed (redundant if DB filter active)
        return true;
      });
      
      setFilteredClients(results);
      setIsFiltering(false);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [clients, debouncedNameFilter, categoryFilter]);

  const todayClients = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return clients.filter((c) => {
        // Handle string or Date object
        const d = new Date(c.daily_date);
        return format(d, "yyyy-MM-dd") === today;
    }).length;
  }, [clients]);

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = nameFilter || categoryFilter !== "all" || dateFrom || dateTo;

  const handleSave = async (data: { patient_name: string; notes: string; category: string[] | null; client_date: string; daily_id?: number | null }) => {
    if (!labId) return;
    setIsSaving(true);
    try {
      const insertWithManualId = async (clientData: any) => {
        // Manual ID logic from old version, simplified for new schema
        let finalDailyId = null;
        if (clientData.daily_id) {
           // Basic conflict check and shift (simplified)
           const { data: existing } = await supabase
             .from("clients")
             .select("uuid, daily_id")
             .eq("lab_id", labId)
             .eq("daily_date", clientData.daily_date)
             .gte("daily_id", clientData.daily_id)
             .order("daily_id", { ascending: false });

           if (existing && existing.length > 0) {
             for (const client of existing) {
                await supabase.from("clients").update({ daily_id: client.daily_id + 1 }).eq("uuid", client.uuid);
             }
           }
           finalDailyId = clientData.daily_id;
        }

        const insertPayload: any = {
            lab_id: labId,
            patient_name: clientData.patient_name,
            notes: clientData.notes || "",
            categories: clientData.category || [],
            daily_date: clientData.daily_date,
            created_by: currentUserId,
            // If trigger overrides, we fix it after
        };
        
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        
        if (finalDailyId !== null && newClient.daily_id !== finalDailyId) {
             await supabase.from("clients").update({ daily_id: finalDailyId }).eq("uuid", newClient.uuid);
             newClient.daily_id = finalDailyId;
        }
        
        return newClient;
      };

      if (editingClient) {
        // Edit logic
        const dateChanged = format(new Date(editingClient.daily_date), 'yyyy-MM-dd') !== data.client_date;
        
        if (dateChanged) {
             await supabase.from("clients").delete().eq("uuid", editingClient.uuid);
             await insertWithManualId({
                 ...data,
                 category: data.category,
                 daily_date: data.client_date,
                 daily_id: data.daily_id
             });
        } else {
             // Update
             let finalDailyId = editingClient.daily_id;
             if (data.daily_id && data.daily_id !== editingClient.daily_id) {
                 finalDailyId = data.daily_id;
                 await supabase.from("clients").update({ daily_id: finalDailyId }).eq("uuid", editingClient.uuid);
             }
             
             await supabase.from("clients").update({
                 patient_name: data.patient_name,
                 notes: data.notes,
                 categories: data.category || [],
                 updated_at: new Date().toISOString()
             }).eq("uuid", editingClient.uuid);
        }
      } else {
        await insertWithManualId({
            patient_name: data.patient_name,
            notes: data.notes,
            category: data.category,
            daily_date: data.client_date,
            daily_id: data.daily_id
        });
      }

      await fetchClients();
      setShowAddModal(false);
      setEditingClient(null);
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
      const selectedClients = clients.filter(c => c.uuid && selectedIds.includes(c.uuid));
      const affectedDates = new Set(selectedClients.map(c => format(new Date(c.daily_date), 'yyyy-MM-dd')));

      const { error } = await supabase
        .from("clients")
        .delete()
        .in("uuid", selectedIds);

      if (error) throw error;

      // Resequence ID logic (simplified for now)
      // Ideally we should call a database function or handle complex shifting here like the old code

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
        await supabase.from("clients").delete().eq("uuid", deleteClient.uuid);
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
        
        let categoryVal: string[] = [];
        if (categoryRaw) {
           const catStr = String(categoryRaw).trim();
           categoryVal = catStr.split(/,|،/).map(s => s.trim()).filter(Boolean);
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

      const { error } = await supabase
        .from("clients")
        .insert(importedClients);

      if (error) throw error;

      await fetchClients();
      alert(`تم استيراد ${importedClients.length} حالة بنجاح`);
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
                <h1 className="text-lg font-bold">معمل {labSlug}</h1>
                <p className="text-xs text-muted-foreground">
                  {todayClients} حالة اليوم • {clients.length} إجمالي
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-xl"
                onClick={() => setShowSettings(true)}
              >
                 <Settings className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Filters - Restore Grid Layout */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Row 1: Name + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">الاسم</Label>
                  <div className="relative">
                    <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="ps-8 h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">التصنيف</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-full text-right">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.uuid} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                      <SelectItem value="none">بدون تصنيف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Date From + Date To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">من تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-9 justify-start font-normal text-sm",
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
                <div className="space-y-1">
                  <Label className="text-xs">إلى تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-9 justify-start font-normal text-sm",
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
            </div>
          </CardContent>
        </Card>

        {/* Results count and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredClients.length} نتيجة</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrintReversed(!printReversed)}
              className="h-7 px-2 text-xs"
            >
              {printReversed ? '↑ تصاعدي' : '↓ تنازلي'}
            </Button>
            {(isLoading || isFiltering) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
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
              className="px-2 sm:px-3"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin sm:me-1" />
              ) : (
                <Upload className="h-4 w-4 sm:me-1" />
              )}
              <span className="hidden sm:inline">استيراد</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={isExporting || filteredClients.length === 0}
              className="px-2 sm:px-3"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin sm:me-1" />
              ) : (
                <Download className="h-4 w-4 sm:me-1" />
              )}
              <span className="hidden sm:inline">تصدير</span>
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="px-2 sm:px-3 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 sm:me-1" />
                <span className="hidden sm:inline">حذف المحدد ({selectedIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
              disabled={filteredClients.length === 0}
              className="px-2 sm:px-3"
            >
              <Printer className="h-4 w-4 sm:me-1" />
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
                      <TableHead className="w-14 text-center">م</TableHead>
                      <TableHead className="w-24 text-center">التاريخ</TableHead>
                      <TableHead className="text-center">الاسم</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">التصنيف</TableHead>
                      <TableHead className="hidden md:table-cell text-center">ملاحظات</TableHead>
                      <TableHead className="w-24 text-center">إجراءات</TableHead>
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
                    {(printReversed ? [...filteredClients].reverse() : filteredClients).slice(0, 100).map((client) => (
                      <TableRow key={client.uuid} data-state={selectedIds.includes(client.uuid || "") ? "selected" : undefined}>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={!!client.uuid && selectedIds.includes(client.uuid)}
                              onCheckedChange={(checked) => handleSelectRow(client.uuid || "", checked as boolean)}
                              className="mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{client.daily_id}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(client.daily_date)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{client.patient_name}</div>
                             <div className="sm:hidden text-xs text-muted-foreground">
                               {client.categories && client.categories.map((cat, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5 ms-1">
                                    {cat}
                                  </Badge>
                               ))}
                             </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {client.categories?.map((cat, i) => (
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

    <SettingsModal 
         isOpen={showSettings}
         onClose={() => setShowSettings(false)}
         categories={categories}
         onCategoriesChange={fetchCategories}
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
        <DialogContent className="max-w-[95vw] h-[95vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>معاينة الطباعة</DialogTitle>
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
                          <title>طباعة حالات المعمل</title>
                          <style>
                            @font-face {
                              font-family: 'Cairo';
                              src: url('/assets/Cairo.ttf') format('truetype');
                              font-weight: 400;
                              font-style: normal;
                            }
                            @page {
                              size: 210mm 297mm;
                              margin: 10mm;
                            }
                            * {
                              box-sizing: border-box;
                              margin: 0;
                              padding: 0;
                            }
                            body {
                              font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
                              font-size: 10px;
                              line-height: 1.2;
                              color: #000;
                              direction: rtl;
                            }
                            .header {
                              text-align: center;
                              margin-bottom: 10px;
                              padding-bottom: 8px;
                              border-bottom: 2px solid #333;
                            }
                            .header h1 {
                              font-size: 16px;
                              margin-bottom: 3px;
                            }
                            .header p {
                              font-size: 10px;
                              color: #666;
                            }
                            div[style*="display: flex"] {
                              display: flex !important;
                              gap: 4mm;
                            }
                            table {
                              width: 48%;
                              border-collapse: collapse;
                              font-size: 12px;
                            }
                            th, td {
                              border: 1px solid #333;
                              padding: 6px 4px;
                              text-align: center;
                              font-size: 12px;
                            }
                            th {
                              background-color: #e5e5e5;
                              font-weight: bold;
                            }
                            td {
                              font-weight: normal;
                            }
                            tr:nth-child(even) {
                              background-color: #fafafa;
                            }
                            .footer {
                              margin-top: 15px;
                              text-align: center;
                              font-size: 8px;
                              color: #666;
                              border-top: 1px solid #ccc;
                              padding-top: 8px;
                            }
                            @media print {
                              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
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
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }
                }}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة
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
                               font-weight: 400;
                               font-style: normal;
                             }
                             @page { size: 210mm 297mm; margin: 10mm; }
                             * { box-sizing: border-box; margin: 0; padding: 0; }
                             body { font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.2; color: #000; direction: rtl; }
                             .header { text-align: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #333; }
                             .header h1 { font-size: 16px; margin-bottom: 3px; }
                             .header p { font-size: 12px; color: #666; }
                             div[style*="display: flex"] { display: flex !important; gap: 4mm; }
                             table { width: 48%; border-collapse: collapse; font-size: 12px; }
                             th, td { border: 1px solid #333; padding: 6px 4px; text-align: center; font-size: 12px; }
                             th { background-color: #e5e5e5; font-weight: bold; }
                             td { font-weight: normal; }
                             tr:nth-child(even) { background-color: #fafafa; }
                             .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
                             @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                           </style>
                         </head>
                         <body>${printContent.innerHTML}</body>
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
                className="gap-2"
                variant="outline"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
            </div>
            <DialogDescription>
              عدد الحالات: {filteredClients.length} | {dateFrom ? format(dateFrom, "d/M/yyyy") : ''} {dateFrom && dateTo ? '-' : ''} {dateTo ? format(dateTo, "d/M/yyyy") : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
            <style dangerouslySetInnerHTML={{ __html: `
              @font-face {
                font-family: 'Cairo';
                src: url('/assets/Cairo.ttf') format('truetype');
                font-weight: 400;
                font-style: normal;
              }
            `}} />
            <div 
              id="print-content"
              className="bg-white mx-auto shadow-lg"
              style={{ width: '210mm', minHeight: '297mm', padding: '8mm', fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" }}
            >
              <div className="header text-center mb-3 pb-2 border-b-2 border-gray-800">
                <h1 className="text-lg font-bold mb-0 text-black">معمل {labSlug}</h1>
                <p className="text-xs text-gray-600">
                  {dateFrom && dateTo ? (
                    <>من {format(dateFrom, "d/M/yyyy")} إلى {format(dateTo, "d/M/yyyy")}</>
                  ) : dateFrom ? (
                    <>من {format(dateFrom, "d/M/yyyy")}</>
                  ) : dateTo ? (
                    <>حتى {format(dateTo, "d/M/yyyy")}</>
                  ) : (
                    <>جميع الحالات</>
                  )}
                  {' • '} إجمالي: {filteredClients.length} حالة
                </p>
              </div>

              <div style={{ display: 'flex', gap: '4mm' }}>
                {(() => {
                  const sortedData = printReversed ? [...filteredClients].reverse() : filteredClients;
                  const half = Math.ceil(sortedData.length / 2);
                  const leftData = sortedData.slice(0, half);
                  const rightData = sortedData.slice(half);
                  
                  // Helper for table rows
                  const TableRows = ({ data }: { data: Client[] }) => (
                    <>
                    {data.map((client, index) => (
                        <tr key={client.uuid} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '12px' }}>{client.daily_id}</td>
                          <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '14px' }}>{client.patient_name}</td>
                          <td className="border border-gray-800 py-2 px-1"></td>
                        </tr>
                      ))}
                    </>
                  );

                  return (
                    <>
                      <table className="border-collapse text-black" style={{ fontSize: '12px', width: '48%' }}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '25px', fontSize: '12px' }}>م</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ fontSize: '12px' }}>الاسم</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '40px', fontSize: '12px' }}>الاستلام</th>
                          </tr>
                        </thead>
                        <tbody>
                            <TableRows data={leftData} />
                        </tbody>
                      </table>

                      <table className="border-collapse text-black" style={{ fontSize: '12px', width: '48%' }}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '25px', fontSize: '12px' }}>م</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ fontSize: '12px' }}>الاسم</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '40px', fontSize: '12px' }}>الاستلام</th>
                          </tr>
                        </thead>
                        <tbody>
                            <TableRows data={rightData} />
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>

              <div className="footer mt-4 pt-2 border-t border-gray-300 text-center text-gray-500" style={{ fontSize: '8px' }}>
                تم الطباعة في {format(new Date(), "d/M/yyyy - h:mm a", { locale: ar })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
