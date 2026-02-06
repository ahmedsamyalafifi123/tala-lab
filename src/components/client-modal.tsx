"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2, Check } from "lucide-react";
import { Client, Category } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLabTests } from "@/hooks/use-lab-tests";
import { useTestGroups } from "@/hooks/use-test-groups";
import { groupTestsByCategory } from "@/lib/test-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { patient_name: string; notes: string; category: string[] | null; daily_date: string; daily_id?: number | null; selected_tests?: string[] }) => Promise<void>;
  client?: Client | null;
  categories: Category[];
  isLoading?: boolean;
}

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  client,
  categories,
  isLoading = false,
}: ClientModalProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [isManualId, setIsManualId] = useState(false);
  const [manualId, setManualId] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { tests, loading: testsLoading } = useLabTests();
  const { groups, loading: groupsLoading } = useTestGroups();

  const groupedTests = groupTestsByCategory(tests);

  // Handle back button behavior
  useEffect(() => {
    if (isOpen) {
      // Push a new state to history when modal opens
      window.history.pushState({ modalOpen: true }, "", window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        // If back button is pressed, close the modal
        event.preventDefault();
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // Clean up history state if closed via other means (not back button)
        // This is tricky, simplified approach: we assume if component unmounts while "open" in history, we might need to go back.
        // But react lifecycle + history is complex. 
        // Better: checking if we are still at the state we pushed? No.
        // Simplest practical solution:
        // When closing via onClose button: we should probably history.back() IF the top state is ours.
        // But onClose is passed from parent. Parent controls open state.
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (client) {
      console.log('🔍 Loading client for edit:', {
        name: client.patient_name,
        selected_tests: client.selected_tests,
        has_tests: client.selected_tests && client.selected_tests.length > 0
      });

      setName(client.patient_name);
      setNotes(client.notes || "");

      // Handle categories - if empty, use "عام" (General) as default
      if (Array.isArray(client.categories) && client.categories.length > 0) {
        setSelectedCategories(client.categories);
      } else {
        // Empty categories - default to "عام"
        setSelectedCategories(['عام']);
      }

      setDate(new Date(client.daily_date));
      setIsManualId(false);
      setManualId("");

      const clientTests = new Set(client.selected_tests || []);
      setSelectedTests(clientTests);
      console.log('✅ Loaded tests:', Array.from(clientTests));

      // Auto-detect which groups are fully selected
      const matchedGroups = new Set<string>();
      groups.forEach((group) => {
        const allTestsSelected = group.test_codes.every((code) => clientTests.has(code));
        if (allTestsSelected && group.test_codes.length > 0) {
          matchedGroups.add(group.group_code);
        }
      });
      setSelectedGroups(matchedGroups);
      console.log('✅ Loaded groups:', Array.from(matchedGroups));
    } else {
      setName("");
      setNotes("");
      // Default to "عام" for new clients
      setSelectedCategories(['عام']);
      setDate(new Date());
      setIsManualId(false);
      setManualId("");
      setSelectedTests(new Set());
      setSelectedGroups(new Set());
    }
  }, [client, isOpen]);

  const handleTestToggle = (testCode: string) => {
    setSelectedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testCode)) {
        newSet.delete(testCode);
      } else {
        newSet.add(testCode);
      }
      return newSet;
    });
  };

  const handleGroupToggle = (groupCode: string) => {
    const group = groups.find((g) => g.group_code === groupCode);
    if (!group) return;

    setSelectedGroups((prev) => {
      const newSet = new Set(prev);
      const isSelected = newSet.has(groupCode);

      if (isSelected) {
        newSet.delete(groupCode);
        // Remove all tests from this group
        setSelectedTests((prevTests) => {
          const newTests = new Set(prevTests);
          group.test_codes.forEach((code) => newTests.delete(code));
          return newTests;
        });
      } else {
        newSet.add(groupCode);
        // Add all tests from this group
        setSelectedTests((prevTests) => {
          const newTests = new Set(prevTests);
          group.test_codes.forEach((code) => newTests.add(code));
          return newTests;
        });
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Always ensure at least "عام" is selected if no categories
    const categoriesToSend = selectedCategories.length > 0 ? selectedCategories : ['عام'];

    const testsToSave = Array.from(selectedTests);
    console.log('💾 Saving client with tests:', testsToSave);

    await onSave({
      patient_name: name.trim(),
      notes: notes.trim(),
      category: categoriesToSend,
      daily_date: format(date, "yyyy-MM-dd"),
      daily_id: isManualId && manualId ? parseInt(manualId) : null,
      selected_tests: testsToSave,
    });

    // If we are adding a new client (not editing), reset the form
    if (!client) {
      setName("");
      setNotes("");
      setSelectedCategories(['عام']); // Reset to "عام" default
      setDate(new Date());
      setIsManualId(false);
      setManualId("");
      setSelectedTests(new Set());
      setSelectedGroups(new Set());
      const nameInput = document.getElementById("name");
      if (nameInput) {
        nameInput.focus();
      }
    }
  };

  const renderFooterButtons = () => (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        className="flex-1 h-12 text-lg"
        onClick={onClose}
        disabled={isLoading}
      >
        إلغاء
      </Button>
      <Button
        type="submit"
        className="flex-1 h-12 text-lg"
        disabled={isLoading || !name.trim()}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            جاري الحفظ...
          </span>
        ) : client ? (
          "تحديث"
        ) : (
          "حفظ"
        )}
      </Button>
    </div>
  );

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className={cn("flex-1 overflow-y-auto overscroll-contain p-4", !isDesktop && "pb-8")}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              الاسم <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم العميل"
              className="h-12 text-lg"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">التاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-lg font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="me-2 h-5 w-5" />
                  {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  locale={ar}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="manual-id-mode" className="text-base cursor-pointer">
                تحديد رقم الحالة يدوياً
              </Label>
              <Switch
                id="manual-id-mode"
                checked={isManualId}
                onCheckedChange={setIsManualId}
              />
            </div>
            
            {isManualId && (
              <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <Label htmlFor="manual-id" className="text-base">
                  رقم الحالة
                </Label>
                <Input
                  id="manual-id"
                  type="number"
                  min="1"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="أدخل رقم الحالة"
                  className="h-12 text-lg"
                />
                <p className="text-sm text-yellow-600/90 dark:text-yellow-500/90 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200 dark:border-yellow-900">
                  تنبيه: سيتم إزاحة الحالات التالية تلقائياً إذا كان الرقم مستخدماً
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base">
              التصنيف
            </Label>
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isCategoryOpen}
                  className="w-full h-12 justify-between text-lg font-normal"
                >
                  <span className="truncate">
                    {selectedCategories.length > 0
                      ? selectedCategories.join(", ")
                      : "اختر التصنيف (اختياري)"}
                  </span>
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {selectedCategories.length}
                    </span>
                    <CalendarIcon className="h-4 w-4 rotate-90" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                 <div className="grid gap-2">
                    {categories.map((cat) => {
                       const isSelected = selectedCategories.includes(cat.name);
                       return (
                          <div
                             key={cat.id}
                             className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                             onClick={() => {
                                if (isSelected) {
                                   setSelectedCategories(prev => prev.filter(c => c !== cat.name));
                                } else {
                                   setSelectedCategories(prev => [...prev, cat.name]);
                                }
                             }}
                          >
                             <div className={cn(
                                "h-4 w-4 rounded-sm border border-primary flex items-center justify-center",
                                isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                             )}>
                                {isSelected && <Check className="h-3 w-3" />}
                             </div>
                             <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {cat.name}
                             </span>
                          </div>
                       );
                    })}
                    {categories.length === 0 && (
                       <p className="text-sm text-muted-foreground p-2 text-center">لا يوجد تصنيفات</p>
                    )}
                 </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">التحاليل المطلوبة</Label>
              <Badge variant="secondary">{selectedTests.size} تحليل</Badge>
            </div>

            {testsLoading || groupsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Test Groups */}
                {groups.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">مجموعات سريعة</Label>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((group) => (
                        <Badge
                          key={group.group_code}
                          variant={selectedGroups.has(group.group_code) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/90 transition-colors"
                          onClick={() => handleGroupToggle(group.group_code)}
                        >
                          {group.group_name_ar}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Tests */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">تحاليل فردية</Label>
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(groupedTests).map(([category, categoryTests]) => (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span>{category}</span>
                            <Badge variant="secondary" className="text-xs">
                              {categoryTests.filter((t) => selectedTests.has(t.test_code)).length}/
                              {categoryTests.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pr-4 pt-2">
                            {categoryTests.map((test) => (
                              <div key={test.test_code} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                  id={`test-${test.test_code}`}
                                  checked={selectedTests.has(test.test_code)}
                                  onCheckedChange={() => handleTestToggle(test.test_code)}
                                />
                                <label
                                  htmlFor={`test-${test.test_code}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {test.test_name_ar}
                                  {test.unit && (
                                    <span className="text-muted-foreground text-xs mr-1">
                                      ({test.unit})
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base">
              الملاحظات
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل الملاحظات (اختياري)"
              className="min-h-[100px] text-lg resize-none"
            />
          </div>

          {!isDesktop && (
            <div className="pt-4 pb-4">
              {renderFooterButtons()}
            </div>
          )}
        </div>
      </div>
      
      {isDesktop && (
        <SheetFooter className="border-t pt-4 flex-shrink-0 px-4">
          {renderFooterButtons()}
        </SheetFooter>
      )}
    </form>
  );

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[85dvh] rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl flex flex-col overflow-hidden p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="border-b p-4 flex-shrink-0">
            <SheetTitle className="text-xl">
              {client ? "تعديل الحالة" : "إضافة حالة جديدة"}
            </SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[90vh] flex flex-col outline-none">
        <DrawerHeader className="border-b p-4 flex-shrink-0 text-right">
          <DrawerTitle className="text-xl">
            {client ? "تعديل الحالة" : "إضافة حالة جديدة"}
          </DrawerTitle>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  );
}
