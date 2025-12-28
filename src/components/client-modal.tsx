"use client";

import { useState, useEffect } from "react";
import { Client } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; notes: string; category: string | null }) => Promise<void>;
  client?: Client | null;
  isLoading?: boolean;
}

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  client,
  isLoading = false,
}: ClientModalProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setNotes(client.notes || "");
      setCategory(client.category);
    } else {
      setName("");
      setNotes("");
      setCategory(null);
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      notes: notes.trim(),
      category: category === "none" ? null : category,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl glass border-0 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-border/50">
            <SheetTitle className="text-xl gradient-text">
              {client ? "تعديل الحالة" : "إضافة حالة جديدة"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                الاسم <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم العميل"
                className="py-6 text-lg bg-secondary/50 border-0 rounded-xl"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base">
                التصنيف
              </Label>
              <Select
                value={category || "none"}
                onValueChange={(value) => setCategory(value === "none" ? null : value)}
              >
                <SelectTrigger className="py-6 text-lg bg-secondary/50 border-0 rounded-xl">
                  <SelectValue placeholder="اختر التصنيف (اختياري)" />
                </SelectTrigger>
                <SelectContent className="glass border-0">
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  <SelectItem value="صحة مدرسية">صحة مدرسية</SelectItem>
                  <SelectItem value="cbc">CBC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="notes" className="text-base">
                الملاحظات
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل الملاحظات (اختياري)"
                className="min-h-[150px] text-lg bg-secondary/50 border-0 rounded-xl resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 py-6 text-lg rounded-xl"
                onClick={onClose}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="flex-1 py-6 text-lg gradient-btn border-0 rounded-xl text-white"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    جاري الحفظ...
                  </span>
                ) : client ? (
                  "تحديث"
                ) : (
                  "حفظ"
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
