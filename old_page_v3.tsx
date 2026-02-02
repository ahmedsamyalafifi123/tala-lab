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

export default function Home() {
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
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
    checkUser();
    fetchCategories();
  }, []);

  // Fetch clients when date filters change
  useEffect(() => {
    fetchClients();
  }, [dateFrom, dateTo]);

  // Refetch when debounced name filter changes (for global search)
  useEffect(() => {
    fetchClients();
  }, [debouncedNameFilter ? "searching" : "not-searching"]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser({ id: user.id, email: user.email || "" });
    } else {
      window.location.href = "/login";
    }
  };

  const fetchClients = async () => {
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
          .order("client_date", { ascending: false })
          .order("daily_id", { ascending: false })
          .range(from, from + batchSize - 1);

        // Skip date filters if user is searching by name (search all clients)
        if (!debouncedNameFilter) {
          if (dateFrom) {
            query = query.gte("client_date", format(dateFrom, "yyyy-MM-dd"));
          }
          if (dateTo) {
            query = query.lte("client_date", format(dateTo, "yyyy-MM-dd"));
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

      setClients(allClients.map((c: any) => {
         // Parse category on load to ensure it's an array in state
         let catArray: string[] | null = null;
         if (c.category) {
            try {
               const parsed = JSON.parse(c.category);
               if (Array.isArray(parsed)) catArray = parsed;
               else catArray = [c.category];
            } catch {
               catArray = [c.category];
            }
         }
         return {
            ...c,
            category: catArray 
         } as Client;
      }));
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
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
        if (debouncedNameFilter && !fuzzyMatchArabic(debouncedNameFilter, client.name)) {
          return false;
        }
        // Category filter
        if (categoryFilter !== "all") {
          // New logic: Check if client.category (string[]) contains the filter
          if (categoryFilter === "none") {
             // 'none' means empty array or null
             const cats = Array.isArray(client.category) ? client.category : [];
             if (cats.length > 0) return false;
          } else {
             // Check if array includes the selected category
             let cats: string[] = [];
             if (Array.isArray(client.category)) {
                cats = client.category;
             } else if (typeof client.category === "string") {
                // Handle legacy string data
                 try {
                     const parsed = JSON.parse(client.category);
                     if (Array.isArray(parsed)) cats = parsed;
                     else cats = [client.category];
                 } catch {
                     cats = [client.category];
                 }
             }
             
             if (!cats.includes(categoryFilter)) return false;
          }
        }
        // Date filtering is done at database level for performance
        return true;
      });
      
      setFilteredClients(results);
      setIsFiltering(false);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [clients, debouncedNameFilter, categoryFilter]);

  const todayClients = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return clients.filter((c) => c.client_date === today).length;
  }, [clients]);

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = nameFilter || categoryFilter !== "all" || dateFrom || dateTo;


  const handleSave = async (data: { name: string; notes: string; category: string[] | null; client_date: string; daily_id?: number | null }) => {
    setIsSaving(true);
    try {
      // Helper to handle insertion with manual ID
      const insertWithManualId = async (clientData: any) => {
        let finalDailyId = null;

        if (clientData.daily_id) {
          console.log("Attempting to set manual daily_id:", clientData.daily_id);
          // Check for conflicts and shift if necessary
          const { data: existingClients } = await supabase
            .from("clients")
            .select("uuid, daily_id")
            .eq("client_date", clientData.client_date)
            .gte("daily_id", clientData.daily_id)
            .order("daily_id", { ascending: false });

          if (existingClients && existingClients.length > 0) {
            console.log("Found conflicts, shifting:", existingClients.length);
            // Shift IDs up by 1, starting from the highest
            for (const client of existingClients) {
              const { error: shiftError } = await supabase
                .from("clients")
                .update({ daily_id: client.daily_id + 1 })
                .eq("uuid", client.uuid);
                
              if (shiftError) console.error("Error shifting client:", client.uuid, shiftError);
            }
          }
          finalDailyId = clientData.daily_id;
        }

        const insertData = { ...clientData };
        if (finalDailyId !== null) {
          insertData.daily_id = finalDailyId;
        }

        const { data: newClient, error } = await supabase
          .from("clients")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        
        // Check if the DB respected our daily_id, if not, force update it
        if (newClient && finalDailyId !== null && newClient.daily_id !== finalDailyId) {
          console.log(`DB override detected. Wanted ${finalDailyId}, got ${newClient.daily_id}. Forcing update...`);
          const { error: updateError } = await supabase
            .from("clients")
            .update({ daily_id: finalDailyId })
            .eq("uuid", newClient.uuid);
            
          if (updateError) {
             console.error("Failed to force update daily_id:", updateError);
             alert("╪¬┘à ╪º┘ä╪¡┘ü╪╕ ┘ê┘ä┘â┘å ┘ü╪┤┘ä ╪¬╪╣┘è┘è┘å ╪▒┘é┘à ╪º┘ä╪¡╪º┘ä╪⌐ ╪º┘ä┘à╪«╪╡╪╡ ╪¿╪│╪¿╪¿ ┘é┘è┘ê╪» ╪º┘ä┘å╪╕╪º┘à");
          } else {
             newClient.daily_id = finalDailyId; 
          }
        }
        
        return newClient;
      };

      if (editingClient) {
        const dateChanged = editingClient.client_date !== data.client_date;
        
        // If date changed, delete and re-insert (treating as new)
        if (dateChanged) {
          await supabase.from("clients").delete().eq("uuid", editingClient.uuid);
          
          const newClient = await insertWithManualId({
            name: data.name,
            notes: data.notes || null,
            // Serialize category array to JSON string
            category: data.category && data.category.length > 0 ? JSON.stringify(data.category) : null,
            client_date: data.client_date,
            created_by: editingClient.created_by,
            updated_by: user?.id,
            daily_id: data.daily_id, // Pass manual ID if provided
          });

          await supabase.from("audit_log").insert({
            table_name: "clients",
            record_id: newClient?.uuid || editingClient.uuid,
            action: "UPDATE",
            old_data: editingClient,
            new_data: newClient,
            user_id: user?.id,
            user_email: user?.email,
          });
        } else {
          // Same date update
          let finalDailyId = editingClient.daily_id;
          
          // Check if manual ID is provided and different from current
          if (data.daily_id && data.daily_id !== editingClient.daily_id) {
             const oldId = editingClient.daily_id;
             const newId = data.daily_id;
             console.log("Updating manual daily_id from", oldId, "to", newId, "Date:", editingClient.client_date);

             // CRITICAL FIX: Temporarily move the current client out of the way (e.g. to -1)
             const { error: vacateError } = await supabase
               .from("clients")
               .update({ daily_id: -1 * oldId }) 
               .eq("uuid", editingClient.uuid);

             if (vacateError) throw vacateError;

             if (newId > oldId) {
                // CASE 1: Moving DOWN (e.g. 57 -> 59)
                // We need to shift items in range (57, 59] UP (decrement ID) to fill the gap left by 57
                // 58 -> 57, 59 -> 58
                // Then place our client at 59
                
                const { data: shiftCandidates } = await supabase
                   .from("clients")
                   .select("uuid, daily_id")
                   .eq("client_date", editingClient.client_date)
                   .gt("daily_id", oldId)
                   .lte("daily_id", newId)
                   .neq("uuid", editingClient.uuid)
                   .order("daily_id", { ascending: true }); // Process 58, then 59 (safe to decrement)

                if (shiftCandidates && shiftCandidates.length > 0) {
                   console.log("Shifting items BACK due to move down:", shiftCandidates.length);
                   for (const client of shiftCandidates) {
                      const { error: shiftError } = await supabase
                        .from("clients")
                        .update({ daily_id: client.daily_id - 1 })
                        .eq("uuid", client.uuid);
                      if (shiftError) console.error("Error shifting client back:", client.uuid, shiftError);
                   }
                }
             } else {
                // CASE 2: Moving UP (e.g. 59 -> 57)
                // We need to shift items in range [57, 59) DOWN (increment ID) to make room at 57
                // 58 -> 59, 57 -> 58
                // Then place our client at 57
                
                const { data: shiftCandidates } = await supabase
                   .from("clients")
                   .select("uuid, daily_id")
                   .eq("client_date", editingClient.client_date)
                   .gte("daily_id", newId)
                   .lt("daily_id", oldId)
                   .neq("uuid", editingClient.uuid)
                   .order("daily_id", { ascending: false }); // Process 58, then 57 (safe to increment)

                if (shiftCandidates && shiftCandidates.length > 0) {
                   console.log("Shifting items FORWARD due to move up:", shiftCandidates.length);
                   for (const client of shiftCandidates) {
                      const { error: shiftError } = await supabase
                        .from("clients")
                        .update({ daily_id: client.daily_id + 1 })
                        .eq("uuid", client.uuid);
                      if (shiftError) console.error("Error shifting client forward:", client.uuid, shiftError);
                   }
                }
             }
             
             finalDailyId = newId;
          }

          const updatePayload: any = {
              name: data.name,
              notes: data.notes || null,
              category: data.category && data.category.length > 0 ? JSON.stringify(data.category) : null,
              updated_at: new Date().toISOString(),
              updated_by: user?.id,
          };
          
          if (finalDailyId !== editingClient.daily_id) {
             updatePayload.daily_id = finalDailyId;
          }

          const { error } = await supabase
            .from("clients")
            .update(updatePayload)
            .eq("uuid", editingClient.uuid);

          if (error) throw error;

          await supabase.from("audit_log").insert({
            table_name: "clients",
            record_id: editingClient.uuid,
            action: "UPDATE",
            old_data: editingClient,
            new_data: { ...editingClient, ...data, daily_id: finalDailyId },
            user_id: user?.id,
            user_email: user?.email,
          });
        }
      } else {
        const newClient = await insertWithManualId({
            name: data.name,
            notes: data.notes || null,
            category: data.category && data.category.length > 0 ? JSON.stringify(data.category) : null,
            client_date: data.client_date,
            created_by: user?.id,
            updated_by: user?.id,
            daily_id: data.daily_id,
        });

        if (newClient) {
          await supabase.from("audit_log").insert({
            table_name: "clients",
            record_id: newClient.uuid,
            action: "INSERT",
            new_data: newClient,
            user_id: user?.id,
            user_email: user?.email,
          });
        }
      }

      await fetchClients();
      
      if (editingClient) {
        setShowAddModal(false);
        setEditingClient(null);
      } else {
        // For new clients, keep modal open to allow adding more
        // We can optionally show a toast here if we had one
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert("╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪º┘ä╪¡┘ü╪╕");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsBulkDeleting(true);
    try {
      // 1. Identify affected dates
      const selectedClients = clients.filter(c => c.uuid && selectedIds.includes(c.uuid));
      const affectedDates = new Set(selectedClients.map(c => c.client_date));

      // 2. Delete from database
      const { error } = await supabase
        .from("clients")
        .delete()
        .in("uuid", selectedIds);

      if (error) throw error;

      // 3. Re-sequence daily_id for affected dates
      for (const date of Array.from(affectedDates)) {
         const { data: remainingClients } = await supabase
            .from("clients")
            .select("uuid, daily_id")
            .eq("client_date", date)
            .order("daily_id", { ascending: true });
            
         if (remainingClients) {
            // Update sequentially
            for (let i = 0; i < remainingClients.length; i++) {
               const client = remainingClients[i];
               const correctId = i + 1;
               if (client.daily_id !== correctId) {
                  await supabase
                    .from("clients")
                    .update({ daily_id: correctId })
                    .eq("uuid", client.uuid);
               }
            }
         }
      }

      // 4. Start fresh fetch to see updated IDs
      await fetchClients();
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);
      
    } catch (error) {
      console.error("Error deleting clients:", error);
      alert("╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪¡╪░┘ü ╪º┘ä╪¡╪º┘ä╪º╪¬");
    } finally {
      setIsBulkDeleting(false);
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

  const handleDelete = async () => {
    if (!deleteClient) return;
    
    setIsDeleting(true);
    try {
      const deletedDate = deleteClient.client_date;
      const deletedDailyId = deleteClient.daily_id;

      await supabase.from("audit_log").insert({
        table_name: "clients",
        record_id: deleteClient.uuid,
        action: "DELETE",
        old_data: deleteClient,
        user_id: user?.id,
        user_email: user?.email,
      });

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("uuid", deleteClient.uuid);

      if (error) throw error;

      // Shift down subsequent IDs
      const { data: subsequentClients } = await supabase
        .from("clients")
        .select("uuid, daily_id")
        .eq("client_date", deletedDate)
        .gt("daily_id", deletedDailyId)
        .order("daily_id", { ascending: true }); // Process in order 3->2, 4->3 etc

      if (subsequentClients && subsequentClients.length > 0) {
        console.log(`Shifting down ${subsequentClients.length} clients after deletion of ${deletedDailyId}`);
        for (const client of subsequentClients) {
           const { error: shiftError } = await supabase
             .from("clients")
             .update({ daily_id: client.daily_id - 1 })
             .eq("uuid", client.uuid);
             
           if (shiftError) console.error("Error shifting down client:", client.uuid, shiftError);
        }
      }

      await fetchClients();
      setDeleteClient(null);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪º┘ä╪¡╪░┘ü");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filteredClients.map((client, index) => ({
        "#": index + 1,
        "╪º┘ä╪▒┘é┘à ╪º┘ä┘è┘ê┘à┘è": client.daily_id,
        "╪º┘ä╪¬╪º╪▒┘è╪«": client.client_date,
        "╪º┘ä╪º╪│┘à": client.name,
        "╪º┘ä╪¬╪╡┘å┘è┘ü": Array.isArray(client.category) ? client.category.join(", ") : (client.category || "-"),
        "╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬": client.notes || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "╪º┘ä╪╣┘à┘ä╪º╪í");
      
      const filename = `clients_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪º┘ä╪¬╪╡╪»┘è╪▒");
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
        alert("╪º┘ä┘à┘ä┘ü ┘ü╪º╪▒╪║");
        return;
      }

      // Map columns - support both Arabic and English headers
      const importedClients = jsonData.map((row) => {
        // Try to get values from different possible column names
        const dailyId = row["id"] || row["daily_id"] || row["╪º┘ä╪▒┘é┘à ╪º┘ä┘è┘ê┘à┘è"] || row["╪▒┘é┘à"];
        const dateValue = row["date"] || row["client_date"] || row["╪º┘ä╪¬╪º╪▒┘è╪«"] || row["╪¬╪º╪▒┘è╪«"];
        const name = row["name"] || row["╪º┘ä╪º╪│┘à"] || row["╪º╪│┘à"];
        const notes = row["notes"] || row["╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬"] || row["┘à┘ä╪º╪¡╪╕╪º╪¬"] || "";
        const categoryRaw = row["category"] || row["╪º┘ä╪¬╪╡┘å┘è┘ü"] || null;
        
        let categoryVal: string[] | null = null;
        if (categoryRaw) {
           const catStr = String(categoryRaw).trim();
           // Split by comma for multiple imports
           categoryVal = catStr.split(/,|╪î/).map(s => s.trim()).filter(Boolean);
        }

        // Parse date - handle different formats
        let clientDate: string;
        if (typeof dateValue === "number") {
          // Excel serial date
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
          clientDate = format(excelDate, "yyyy-MM-dd");
        } else if (typeof dateValue === "string") {
          // Try to parse string date
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            clientDate = format(parsedDate, "yyyy-MM-dd");
          } else {
            clientDate = format(new Date(), "yyyy-MM-dd");
          }
        } else {
          clientDate = format(new Date(), "yyyy-MM-dd");
        }

        return {
          name: String(name || "").trim(),
          notes: notes ? String(notes).trim() : null,
          category: categoryVal && categoryVal.length > 0 ? JSON.stringify(categoryVal) : null,
          client_date: clientDate,
          created_by: user?.id,
          updated_by: user?.id,
        };
      }).filter(c => c.name); // Filter out rows without names

      if (importedClients.length === 0) {
        alert("┘ä┘à ┘è╪¬┘à ╪º┘ä╪╣╪½┘ê╪▒ ╪╣┘ä┘ë ╪¿┘è╪º┘å╪º╪¬ ╪╡╪º┘ä╪¡╪⌐ ┘ä┘ä╪º╪│╪¬┘è╪▒╪º╪»");
        return;
      }

      // Insert all clients
      const { error } = await supabase
        .from("clients")
        .insert(importedClients);

      if (error) throw error;

      await fetchClients();
      alert(`╪¬┘à ╪º╪│╪¬┘è╪▒╪º╪» ${importedClients.length} ╪¡╪º┘ä╪⌐ ╪¿┘å╪¼╪º╪¡`);
    } catch (error) {
      console.error("Error importing:", error);
      alert("╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪º┘ä╪º╪│╪¬┘è╪▒╪º╪»");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateStr: string) => {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary animate-pulse" />
          <p className="text-muted-foreground">╪¼╪º╪▒┘è ╪º┘ä╪¬╪¡┘à┘è┘ä...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={fetchClients}>
    <main className="min-h-screen pb-24">
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
              />
              <div>
                <h1 className="text-lg font-bold">╪¡╪º┘ä╪º╪¬ ┘à╪╣┘à┘ä ╪╣┘è╪º╪»╪⌐ ╪¬┘ä╪º</h1>
                <p className="text-xs text-muted-foreground">
                  {todayClients} ╪¡╪º┘ä╪⌐ ╪º┘ä┘è┘ê┘à ΓÇó {clients.length} ╪Ñ╪¼┘à╪º┘ä┘è
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
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Row 1: Name + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">╪º┘ä╪º╪│┘à</Label>
                  <div className="relative">
                    <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="╪º╪¿╪¡╪½..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="ps-8 h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">╪º┘ä╪¬╪╡┘å┘è┘ü</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-full text-right">
                      <SelectValue placeholder="╪º┘ä┘â┘ä" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">╪º┘ä┘â┘ä</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                      <SelectItem value="none">╪¿╪»┘ê┘å ╪¬╪╡┘å┘è┘ü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Date From + Date To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">┘à┘å ╪¬╪º╪▒┘è╪«</Label>
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
                        {dateFrom ? format(dateFrom, "d/M/yyyy") : "╪º╪«╪¬╪▒"}
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
                  <Label className="text-xs">╪Ñ┘ä┘ë ╪¬╪º╪▒┘è╪«</Label>
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
                        {dateTo ? format(dateTo, "d/M/yyyy") : "╪º╪«╪¬╪▒"}
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
            <Badge variant="secondary">{filteredClients.length} ┘å╪¬┘è╪¼╪⌐</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrintReversed(!printReversed)}
              className="h-7 px-2 text-xs"
            >
              {printReversed ? 'Γåæ ╪¬╪╡╪º╪╣╪»┘è' : 'Γåô ╪¬┘å╪º╪▓┘ä┘è'}
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
              <span className="hidden sm:inline">╪º╪│╪¬┘è╪▒╪º╪»</span>
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
              <span className="hidden sm:inline">╪¬╪╡╪»┘è╪▒</span>
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="px-2 sm:px-3 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 sm:me-1" />
                <span className="hidden sm:inline">╪¡╪░┘ü ╪º┘ä┘à╪¡╪»╪» ({selectedIds.length})</span>
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
              <span className="hidden sm:inline">╪╖╪¿╪º╪╣╪⌐</span>
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
                    <TableHead className="w-14 text-center">┘à</TableHead>
                    <TableHead className="w-24 text-center">╪º┘ä╪¬╪º╪▒┘è╪«</TableHead>
                    <TableHead className="text-center">╪º┘ä╪º╪│┘à</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">╪º┘ä╪¬╪╡┘å┘è┘ü</TableHead>
                    <TableHead className="hidden md:table-cell text-center">╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬</TableHead>
                    <TableHead className="w-24 text-center">╪Ñ╪¼╪▒╪º╪í╪º╪¬</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {hasFilters ? "┘ä╪º ╪¬┘ê╪¼╪» ┘å╪¬╪º╪ª╪¼" : "┘ä╪º ╪¬┘ê╪¼╪» ╪¿┘è╪º┘å╪º╪¬"}
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
                              aria-label={`Select ${client.name}`}
                              className="mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{client.daily_id}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(client.client_date)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{client.name}</div>
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {client.category && Array.isArray(client.category) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {client.category.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] px-1 h-5">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {client.category ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(client.category) ? (
                                  client.category.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {cat}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="secondary">
                                    {client.category}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                            {client.notes || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingClient(client);
                                  setShowAddModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteClient(client)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredClients.length > 100 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-xs text-muted-foreground bg-muted/20">
                            ┘è╪¬┘à ╪╣╪▒╪╢ ╪ú┘ê┘ä 100 ┘å╪¬┘è╪¼╪⌐ ┘ü┘é╪╖ ┘ä╪╢┘à╪º┘å ╪│╪▒╪╣╪⌐ ╪º┘ä╪¿╪¡╪½. ┘è╪▒╪¼┘ë ╪¬╪»┘é┘è┘é ╪º┘ä╪¿╪¡╪½ ┘ä┘ä┘ê╪╡┘ê┘ä ┘ä┘å╪¬╪º╪ª╪¼ ┘à╪¡╪»╪»╪⌐.
                          </TableCell>
                        </TableRow>
                      )}
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

      {/* Add/Edit Modal */}
      <ClientModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        client={editingClient}
        categories={categories}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>╪¬╪ú┘â┘è╪» ╪º┘ä╪¡╪░┘ü</AlertDialogTitle>
            <AlertDialogDescription>
              ┘ç┘ä ╪ú┘å╪¬ ┘à╪¬╪ú┘â╪» ┘à┘å ╪¡╪░┘ü ╪¡╪º┘ä╪⌐ <strong>{deleteClient?.name}</strong>╪ƒ
              <br />
              ┘ä╪º ┘è┘à┘â┘å ╪º┘ä╪¬╪▒╪º╪¼╪╣ ╪╣┘å ┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel disabled={isDeleting}>╪Ñ┘ä╪║╪º╪í</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ╪¼╪º╪▒┘è ╪º┘ä╪¡╪░┘ü...
                </span>
              ) : (
                "╪¡╪░┘ü"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>╪¬╪ú┘â┘è╪» ╪º┘ä╪¡╪░┘ü ╪º┘ä╪¼┘à╪º╪╣┘è</AlertDialogTitle>
            <AlertDialogDescription>
              ┘ç┘ä ╪ú┘å╪¬ ┘à╪¬╪ú┘â╪» ┘à┘å ╪¡╪░┘ü <strong>{selectedIds.length}</strong> ╪¡╪º┘ä╪⌐ ┘à╪¡╪»╪»╪⌐╪ƒ
              <br />
              ┘ä╪º ┘è┘à┘â┘å ╪º┘ä╪¬╪▒╪º╪¼╪╣ ╪╣┘å ┘ç╪░╪º ╪º┘ä╪Ñ╪¼╪▒╪º╪í.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel disabled={isBulkDeleting}>╪Ñ┘ä╪║╪º╪í</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ╪¼╪º╪▒┘è ╪º┘ä╪¡╪░┘ü...
                </span>
              ) : (
                "╪¡╪░┘ü ╪º┘ä┘à╪¡╪»╪»"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">╪º╪│╪¬┘è╪▒╪º╪» ╪º┘ä╪¿┘è╪º┘å╪º╪¬</DialogTitle>
            <DialogDescription className="text-right">
              ┘è╪▒╪¼┘ë ╪º┘ä╪¬╪ú┘â╪» ┘à┘å ╪ú┘å ┘à┘ä┘ü Excel ┘è╪¬╪¿╪╣ ╪º┘ä╪╡┘è╪║╪⌐ ╪º┘ä┘à╪╖┘ä┘ê╪¿╪⌐
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Format explanation */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">╪╡┘è╪║╪⌐ ╪º┘ä┘à┘ä┘ü ╪º┘ä┘à╪╖┘ä┘ê╪¿╪⌐:</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-right border-b">╪º╪│┘à ╪º┘ä╪╣┘à┘ê╪»</th>
                      <th className="py-2 px-3 text-right border-b">┘à╪╖┘ä┘ê╪¿</th>
                      <th className="py-2 px-3 text-right border-b">┘à╪½╪º┘ä</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">╪º┘ä╪º╪│┘à / name</td>
                      <td className="py-2 px-3"><Badge variant="destructive" className="text-[10px]">┘à╪╖┘ä┘ê╪¿</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">┘à╪¡┘à╪» ╪ú╪¡┘à╪»</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">╪º┘ä╪¬╪º╪▒┘è╪« / date</td>
                      <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px]">╪º╪«╪¬┘è╪º╪▒┘è</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">2024-12-31</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">╪º┘ä╪¬╪╡┘å┘è┘ü / category</td>
                      <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px]">╪º╪«╪¬┘è╪º╪▒┘è</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">╪ú╪┤╪╣╪⌐</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-xs">╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬ / notes</td>
                      <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px]">╪º╪«╪¬┘è╪º╪▒┘è</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">┘à┘ä╪º╪¡╪╕╪⌐...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                ΓÇó ┘è┘à┘â┘å ╪º╪│╪¬╪«╪»╪º┘à ╪ú╪│┘à╪º╪í ╪º┘ä╪ú╪╣┘à╪»╪⌐ ╪¿╪º┘ä╪╣╪▒╪¿┘è╪⌐ ╪ú┘ê ╪º┘ä╪Ñ┘å╪¼┘ä┘è╪▓┘è╪⌐<br/>
                ΓÇó ╪º┘ä╪¬╪º╪▒┘è╪« ┘è╪¼╪¿ ╪ú┘å ┘è┘â┘ê┘å ╪¿╪╡┘è╪║╪⌐ YYYY-MM-DD ╪ú┘ê ╪¬╪º╪▒┘è╪« Excel<br/>
                ΓÇó ╪º┘ä┘à┘ä┘ü╪º╪¬ ╪º┘ä┘à╪»╪╣┘ê┘à╪⌐: .xlsx, .xls, .csv
              </p>
            </div>

            {/* File picker button */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowImportModal(false);
                }}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    ╪¼╪º╪▒┘è ╪º┘ä╪º╪│╪¬┘è╪▒╪º╪»...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 me-2" />
                    ╪º╪«╪¬╪▒ ┘à┘ä┘ü ┘ä┘ä╪º╪│╪¬┘è╪▒╪º╪»
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportModal(false)}
              >
                ╪Ñ┘ä╪║╪º╪í
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
              <DialogTitle>┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä╪╖╪¿╪º╪╣╪⌐</DialogTitle>
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
                          <title>╪╖╪¿╪º╪╣╪⌐ ╪¡╪º┘ä╪º╪¬ ╪º┘ä┘à╪╣┘à┘ä</title>
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
                ╪╖╪¿╪º╪╣╪⌐
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
                          <title>╪¡╪º┘ä╪º╪¬ ╪º┘ä┘à╪╣┘à┘ä - PDF</title>
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
                      // Show alert to save as PDF
                      setTimeout(() => {
                        alert('┘ä╪¡┘ü╪╕ ┘â┘Ç PDF: ╪º╪«╪¬╪▒ "╪¡┘ü╪╕ ┘â┘Ç PDF" ╪ú┘ê "Save as PDF" ┘ü┘è ╪«┘è╪º╪▒╪º╪¬ ╪º┘ä╪╖╪º╪¿╪╣╪⌐');
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
              ╪╣╪»╪» ╪º┘ä╪¡╪º┘ä╪º╪¬: {filteredClients.length} | {dateFrom ? format(dateFrom, "d/M/yyyy") : ''} {dateFrom && dateTo ? '-' : ''} {dateTo ? format(dateTo, "d/M/yyyy") : ''}
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
              {/* Header */}
              <div className="header text-center mb-3 pb-2 border-b-2 border-gray-800">
                <h1 className="text-lg font-bold mb-0 text-black">╪¡╪º┘ä╪º╪¬ ┘à╪╣┘à┘ä ╪╣┘è╪º╪»╪⌐ ╪¬┘ä╪º</h1>
                <p className="text-xs text-gray-600">
                  {dateFrom && dateTo ? (
                    <>┘à┘å {format(dateFrom, "d/M/yyyy")} ╪Ñ┘ä┘ë {format(dateTo, "d/M/yyyy")}</>
                  ) : dateFrom ? (
                    <>┘à┘å {format(dateFrom, "d/M/yyyy")}</>
                  ) : dateTo ? (
                    <>╪¡╪¬┘ë {format(dateTo, "d/M/yyyy")}</>
                  ) : (
                    <>╪¼┘à┘è╪╣ ╪º┘ä╪¡╪º┘ä╪º╪¬</>
                  )}
                  {' ΓÇó '} ╪Ñ╪¼┘à╪º┘ä┘è: {filteredClients.length} ╪¡╪º┘ä╪⌐
                </p>
              </div>

              {/* Two Tables Side by Side */}
              <div style={{ display: 'flex', gap: '4mm' }}>
                {/* Split data into two halves */}
                {(() => {
                  const sortedData = printReversed ? [...filteredClients].reverse() : filteredClients;
                  const half = Math.ceil(sortedData.length / 2);
                  const leftData = sortedData.slice(0, half);
                  const rightData = sortedData.slice(half);
                  
                  return (
                    <>
                      {/* Left Table */}
                      <table className="border-collapse text-black" style={{ fontSize: '12px', width: '48%' }}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '25px', fontSize: '12px' }}>┘à</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ fontSize: '12px' }}>╪º┘ä╪º╪│┘à</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '40px', fontSize: '12px' }}>╪º┘ä╪º╪│╪¬┘ä╪º┘à</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leftData.map((client, index) => (
                            <tr key={client.uuid} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '12px' }}>{client.daily_id}</td>
                              <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '14px' }}>{client.name}</td>
                              <td className="border border-gray-800 py-2 px-1"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Right Table */}
                      <table className="border-collapse text-black" style={{ fontSize: '12px', width: '48%' }}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '25px', fontSize: '12px' }}>┘à</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ fontSize: '12px' }}>╪º┘ä╪º╪│┘à</th>
                            <th className="border border-gray-800 p-1 text-center" style={{ width: '40px', fontSize: '12px' }}>╪º┘ä╪º╪│╪¬┘ä╪º┘à</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rightData.map((client, index) => (
                            <tr key={client.uuid} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '12px' }}>{client.daily_id}</td>
                              <td className="border border-gray-800 py-2 px-1 text-center" style={{ fontSize: '14px' }}>{client.name}</td>
                              <td className="border border-gray-800 py-2 px-1"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="footer mt-4 pt-2 border-t border-gray-300 text-center text-gray-500" style={{ fontSize: '8px' }}>
                ╪¬┘à ╪º┘ä╪╖╪¿╪º╪╣╪⌐ ┘ü┘è {format(new Date(), "d/M/yyyy - h:mm a", { locale: ar })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        categories={categories}
        onCategoriesChange={() => {
          fetchCategories();
          fetchClients();
        }}
      />
    </>
  );
}
