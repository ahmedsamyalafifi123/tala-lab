"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"

interface CreateLabDialogProps {
  onLabCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateLabDialog({ onLabCreated, trigger }: CreateLabDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    slug: '',
  })

  // Basic slugify function
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '')       // Trim - from end of text
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // If slug hasn't been manually edited (or is empty), auto-generate it
    if (!formData.slug || formData.slug === slugify(formData.name_en || formData.name)) {
        setFormData({ 
            ...formData, 
            name: val,
            // Only update slug if name_en is empty, otherwise name_en drives slug usually for better URLs
            slug: !formData.name_en ? slugify(val) : formData.slug 
        })
    } else {
        setFormData({ ...formData, name: val })
    }
  }

  const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Auto-update slug from English name if possible
    if (!formData.slug || formData.slug === slugify(formData.name_en || formData.name)) {
        setFormData({ 
            ...formData, 
            name_en: val,
            slug: slugify(val || formData.name) 
        })
    } else {
        setFormData({ ...formData, name_en: val })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create lab record
      const { data: lab, error: labError } = await supabase
        .from('labs')
        .insert({
          name: formData.name,
          name_en: formData.name_en,
          slug: formData.slug || slugify(formData.name_en || formData.name),
        })
        .select()
        .single()

      if (labError) throw labError

      // Add current user as manager for this lab
      const { error: userError } = await supabase
        .from('lab_users')
        .insert({
          lab_id: lab.uuid,
          user_id: user.id,
          role: 'manager',
          is_manager: true,
          status: 'active',
        })

      if (userError) throw userError

      setIsOpen(false)
      setFormData({ name: '', name_en: '', slug: '' }) // Reset form
      
      if (onLabCreated) {
          onLabCreated()
      } else {
           // Default behavior: go to the new lab settings or just refresh?
           // The user just wants a modal. Usually we might want to refresh the list or redirect.
           // Let's redirect to settings as a "success" confirmation step, or just stay.
           // Redirecting seems best to immediately configure it.
           router.push(`/manager/labs/${lab.uuid}`)
      }

    } catch (error) {
      console.error('Error creating lab:', error)
      alert('حدث خطأ أثناء إنشاء المعمل')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="shadow-lg hover:shadow-primary/20 transition-all cursor-pointer">
            <Plus className="ml-2 h-4 w-4" />
            إنشاء معمل جديد
        </Button>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إنشاء معمل جديد</DialogTitle>
          <DialogDescription>
            قم بإدخال بيانات المعمل الجديد. سيتم تعيينك مديراً له تلقائياً.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name">اسم المعمل (عربي) <span className="text-destructive">*</span></Label>
                <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="مثال: معمل الشفاء"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="name_en">اسم المعمل (English)</Label>
                <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={handleNameEnChange}
                    placeholder="Example: Al-Shifa Lab"
                    dir="ltr"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="slug">الرابط (slug) <span className="text-destructive">*</span></Label>
                <Input
                    id="slug"
                    required
                    pattern="[a-z0-9-]+"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="al-shifa-lab"
                    dir="ltr"
                    className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground text-left" dir="ltr">
                  URL: .../<strong>{formData.slug || 'slug'}</strong>
                </p>
            </div>

            <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading} className="cursor-pointer">
                    إلغاء
                </Button>
                <Button type="submit" disabled={isLoading || !formData.name || !formData.slug} className="cursor-pointer">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري الإنشاء...
                        </>
                    ) : 'إنشاء المعمل'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
