"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; notes: string; category: string | null; client_date: string }) => Promise<void>;
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
  const [category, setCategory] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (client) {
      setName(client.name);
      setNotes(client.notes || "");
      setCategory(client.category);
      setDate(new Date(client.client_date));
    } else {
      setName("");
      setNotes("");
      setCategory(null);
      setDate(new Date());
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      notes: notes.trim(),
      category: category === "none" ? null : category,
      client_date: format(date, "yyyy-MM-dd"),
    });

    // If we are adding a new client (not editing), reset the form to allow adding another
    if (!client) {
      setName("");
      setNotes("");
      setCategory(null);
      // We keep the date as is, assuming the user might want to add multiple entries for the same date
      // Reset focus to name input
      const nameInput = document.getElementById("name");
      if (nameInput) {
        nameInput.focus();
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[90dvh] rounded-t-3xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-xl">
              {client ? "تعديل الحالة" : "إضافة حالة جديدة"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base">
                التصنيف
              </Label>
              <Select
                value={category || "none"}
                onValueChange={(value) => setCategory(value === "none" ? null : value)}
              >
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="اختر التصنيف (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <SheetFooter className="border-t pt-4">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
