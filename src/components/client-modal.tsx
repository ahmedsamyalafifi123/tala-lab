"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2, Check, User, FileText, FlaskConical } from "lucide-react";
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
  onSave: (data: { 
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
  }) => Promise<void>;
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
  const [gender, setGender] = useState<string>("ذكر");
  const [age, setAge] = useState<string>("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [entity, setEntity] = useState<string>("");
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
      setGender(client.patient_gender || "");
      setAge(client.patient_age?.toString() || "");
      setInsuranceNumber(client.insurance_number || "");
      setEntity(client.entity || "");
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
      setGender("ذكر");
      setAge("");
      setInsuranceNumber("");
      setEntity("");
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

  const handleSelectAllCategory = (categoryTests: any[], selectAll: boolean) => {
    const categoryCodes = categoryTests.map((test) => test.test_code);
    setSelectedTests((prev) => {
      const newSet = new Set(prev);
      if (selectAll) {
        categoryCodes.forEach((code) => newSet.add(code));
      } else {
        categoryCodes.forEach((code) => newSet.delete(code));
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
      patient_gender: (gender && gender !== "none") ? gender : undefined,
      insurance_number: insuranceNumber.trim() || undefined,
      entity: (entity && entity !== "none") ? entity : undefined,
      patient_age: age ? parseInt(age) : undefined,
    });

    // If we are adding a new client (not editing), reset the form
    if (!client) {
      setName("");
      setGender("ذكر");
      setAge("");
      setInsuranceNumber("");
      setEntity("");
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
      <div className={cn("flex-1 overflow-y-auto overscroll-contain p-4 space-y-6", !isDesktop && "pb-8")}>
        
        {/* Section 1: Patient Information */}
        <div className="space-y-4 p-4 rounded-2xl border bg-muted/30">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
            <User className="h-4 w-4" />
            بيانات المريض
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">الاسم الكامل <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم العميل"
                className="h-11 bg-background"
                required
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 md:col-span-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">العمر</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="سنة"
                  className="h-11 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">الجنس</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="h-11 text-right bg-background">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    <SelectItem value="ذكر">ذكر</SelectItem>
                    <SelectItem value="أنثى">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Administrative Information */}
        <div className="space-y-4 p-4 rounded-2xl border bg-muted/30">

          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entity" className="text-sm font-medium">الجهة</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger id="entity" className="h-11 text-right bg-background">
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  <SelectItem value="معاشات">معاشات</SelectItem>
                  <SelectItem value="ارامل">ارامل</SelectItem>
                  <SelectItem value="موظفين">موظفين</SelectItem>
                  <SelectItem value="طلبة">طلبة</SelectItem>
                  <SelectItem value="المرأة المعيلة">المرأة المعيلة</SelectItem>
                  <SelectItem value="المقاولات">المقاولات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance_number" className="text-sm font-medium truncate">الرقم التأميني</Label>
              <Input
                id="insurance_number"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                placeholder="الرقم"
                className="h-11 bg-background"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Booking & Category */}
        <div className="space-y-4 p-4 rounded-2xl border bg-muted/30">


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start font-normal bg-background px-2",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="me-1 h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">{date ? format(date, "d/M/yy") : "اختر"}</span>
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">التصنيف</Label>
              <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryOpen}
                    className="w-full h-11 justify-between font-normal bg-background px-2"
                  >
                    <span className="truncate text-xs">
                      {selectedCategories.length > 0
                        ? selectedCategories[0] + (selectedCategories.length > 1 ? ` +${selectedCategories.length - 1}` : '')
                        : "اختر"}
                    </span>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">{selectedCategories.length}</Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="grid gap-1">
                      {categories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.name);
                        return (
                            <div
                              key={cat.id}
                              className={cn(
                                "flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors",
                                isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                              )}
                              onClick={() => {
                                  if (isSelected) {
                                    setSelectedCategories(prev => prev.filter(c => c !== cat.name));
                                  } else {
                                    setSelectedCategories(prev => [...prev, cat.name]);
                                  }
                              }}
                            >
                              <div className={cn(
                                  "h-4 w-4 rounded-sm border flex items-center justify-center",
                                  isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                              )}>
                                  {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                        );
                      })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-2 border-t mt-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="manual-id-mode" className="text-sm font-medium cursor-pointer">تحديد رقم الحالة يدوياً</Label>
              <Switch
                id="manual-id-mode"
                checked={isManualId}
                onCheckedChange={setIsManualId}
              />
            </div>
            
            {isManualId && (
              <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <Input
                  id="manual-id"
                  type="number"
                  min="1"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="أدخل رقم الحالة"
                  className="h-11 bg-background"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Tests */}
        <div className="space-y-4 p-4 rounded-2xl border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FlaskConical className="h-4 w-4" />
              التحاليل المطلوبة
            </div>
            <Badge variant="secondary" className="rounded-full px-3">{selectedTests.size} تحليل</Badge>
          </div>

          <div className="space-y-3">
            {testsLoading || groupsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <>
                {groups.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {groups.map((group) => {
                      const isActive = selectedGroups.has(group.group_code);
                      return (
                        <Badge
                          key={group.group_code}
                          variant={isActive ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer py-1.5 px-3 transition-all",
                            !isActive && "bg-background text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => handleGroupToggle(group.group_code)}
                        >
                          {group.group_name_ar}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <Accordion type="multiple" className="w-full space-y-2">
                  {Object.entries(groupedTests).map(([category, categoryTests]) => {
                    const allSelected = categoryTests.every((t) => selectedTests.has(t.test_code));
                    const selectedCount = categoryTests.filter((t) => selectedTests.has(t.test_code)).length;
                    return (
                    <AccordionItem key={category} value={category} className="border rounded-xl bg-background overflow-hidden">
                      <div className="flex items-center px-3 hover:bg-muted/30 transition-colors">
                        <AccordionTrigger className="flex-1 py-3 text-sm font-bold hover:no-underline">
                          <div className="flex items-center gap-3">
                            <span>{category}</span>
                            {selectedCount > 0 && (
                              <Badge variant="secondary" className="h-5 text-[10px] bg-primary/10 text-primary border-primary/20">
                                {selectedCount}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 text-xs font-semibold hover:bg-primary/10",
                            allSelected ? "text-destructive" : "text-primary"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllCategory(categoryTests, !allSelected);
                          }}
                        >
                          {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                        </Button>
                      </div>
                      <AccordionContent className="px-4 pb-3 pt-1 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {categoryTests.map((test) => {
                            const isSelected = selectedTests.has(test.test_code);
                            return (
                              <div 
                                key={test.test_code} 
                                className={cn(
                                  "flex items-center space-x-2 space-x-reverse p-2.5 rounded-lg border transition-all cursor-pointer",
                                  isSelected 
                                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20" 
                                    : "hover:bg-muted/50 border-transparent bg-muted/20"
                                )}
                                onClick={() => handleTestToggle(test.test_code)}
                              >
                                <Checkbox
                                  id={`test-${test.test_code}`}
                                  checked={isSelected}
                                  onCheckedChange={() => {}} 
                                  className={cn(isSelected && "border-primary bg-primary text-primary-foreground")}
                                />
                                <div className="flex-1 truncate mr-2">
                                  <div className={cn("text-sm font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                    {test.test_name_ar}
                                  </div>
                                  <div className="text-muted-foreground text-[10px] truncate leading-tight">
                                    {test.test_name_en}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    );
                  })}
                </Accordion>
              </>
            )}
          </div>
        </div>

        {/* Section 5: Notes */}
        <div className="space-y-2 p-4 rounded-2xl border bg-muted/30">
          <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            الملاحظات
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية..."
            className="min-h-[80px] bg-background resize-none border-none focus-visible:ring-1"
          />
        </div>
      </div>
      
      {isDesktop && (
        <SheetFooter className="border-t pt-4 flex-shrink-0 px-4">
          {renderFooterButtons()}
        </SheetFooter>
      )}
      {!isDesktop && (
        <div className="p-4 border-t">
          {renderFooterButtons()}
        </div>
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
