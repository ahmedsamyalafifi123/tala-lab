"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function NewLabPage() {
  const router = useRouter()
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
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '')       // Trim - from end of text
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

      router.push(`/manager/labs/${lab.uuid}`)
    } catch (error) {
      console.error('Error creating lab:', error)
      alert('حدث خطأ أثناء إنشاء المعمل')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
             <CardTitle className="text-2xl text-center">إنشاء معمل جديد</CardTitle>
        </CardHeader>
        
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>اسم المعمل (عربي)</Label>
                <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: معمل الشفاء"
                />
            </div>

            <div className="space-y-2">
                <Label>اسم المعمل (English)</Label>
                <Input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Al-Shifa Lab"
                dir="ltr"
                />
            </div>

            <div className="space-y-2">
                <Label>الرابط (slug)</Label>
                <Input
                type="text"
                required
                pattern="[a-z0-9-]+"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="al-shifa-lab"
                dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
                  URL: domain.com/{formData.slug || '...'}
                </p>
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الإنشاء...
                    </span>
                ) : 'إنشاء المعمل'}
            </Button>
            </form>
        </CardContent>
      </Card>
    </main>
  )
}
