"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lab } from '@/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Loader2, 
    ArrowRight, 
    Save, 
    Trash2, 
    ExternalLink,
    AlertTriangle,
    CheckCircle2
} from "lucide-react"
import { LabUserManagement } from "@/components/lab-user-management"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue, 
} from "@/components/ui/select"

export default function LabDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      slug: '',
      status: 'active'
  })

  useEffect(() => {
    fetchLabDetails()
  }, [params.id])

  useEffect(() => {
      if (lab) {
          setFormData({
              name: lab.name,
              slug: lab.slug,
              status: lab.status
          })
      }
  }, [lab])

  const fetchLabDetails = async () => {
    const supabase = createClient()

    // Fetch lab details
    const { data: labData } = await supabase
      .from('labs')
      .select('*')
      .eq('uuid', params.id)
      .single()

    setLab(labData)
    setIsLoading(false)
  }

  const handleUpdate = async () => {
    setIsSaving(true)
    try {
        const supabase = createClient()
        const { error } = await supabase
          .from('labs')
          .update({
              name: formData.name,
              slug: formData.slug,
              status: formData.status,
              updated_at: new Date().toISOString()
          })
          .eq('uuid', params.id)

        if (error) throw error

        // Refresh data
        await fetchLabDetails()
        alert("تم حفظ التغييرات بنجاح")
    } catch (error) {
        console.error("Error updating lab:", error)
        alert("حدث خطأ أثناء الحفظ. يرجى التأكد من أن الرابط غير مستخدم مسبقاً.") // Handle unique slug error hint
    } finally {
        setIsSaving(false)
    }
  }

  const handleDelete = async () => {
      setIsDeleting(true)
      try {
          const supabase = createClient()
          
          // Note: Assuming Database Cascade Delete is enabled for related tables (clients, lab_users, categories).
          // If not, we would need to delete them manually here.
          // Usually 'labs' is a parent table.
          
          const { error } = await supabase
            .from('labs')
            .delete()
            .eq('uuid', params.id)
          
          if (error) throw error

          router.push('/manager/labs')
      } catch (error) {
          console.error("Error deleting lab:", error)
          alert("حدث خطأ أثناء حذف المعمل. يرجى المحاولة مرة أخرى.")
      } finally {
          setIsDeleting(false)
      }
  }

  if (isLoading) {
    return (
        <main className="min-h-screen p-8 flex justify-center items-center">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
    )
  }

  if (!lab) {
    return <main className="min-h-screen p-8">المعمل غير موجود</main>
  }

  return (
    <main className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <Button
                variant="ghost"
                onClick={() => router.push('/manager/labs')}
                className="gap-2 mb-2 p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
            >
                <ArrowRight className="h-4 w-4" />
                العودة للمعامل
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{lab.name}</h1>
            <p className="text-muted-foreground">إدارة إعدادات المعمل والمستخدمين</p>
        </div>
        
        <Button variant="outline" onClick={() => window.open(`/${lab.slug}`, '_blank')} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            فتح المعمل
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Right Column: Settings */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>الإعدادات العامة</CardTitle>
                    <CardDescription>تعديل المعلومات الأساسية للمعمل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">اسم المعمل</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="مثال: معمل الشفاء"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="slug">رابط المعمل (Slug)</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground bg-muted h-10 px-3 flex items-center rounded-r-md border border-l-0 text-sm ltr-force dir-ltr">
                                /{formData.slug}
                            </span>
                            <Input 
                                id="slug" 
                                value={formData.slug} 
                                onChange={(e) => setFormData({...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})}
                                placeholder="lab-name"
                                className="rounded-r-none font-mono"
                                dir="ltr"
                            />
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            يستخدم هذا الاسم في رابط الوصول للمعمل. يجب أن يكون فريداً وباللغة الإنجليزية.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>حالة المعمل</Label>
                        <Select 
                            value={formData.status} 
                            onValueChange={(value) => setFormData({...formData, status: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span>نشط</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="suspended">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                        <span>معلق</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="inactive">
                                     <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                                        <span>غير نشط</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 bg-muted/5 flex justify-end">
                    <Button onClick={handleUpdate} disabled={isSaving || !formData.name || !formData.slug}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                حفظ التغييرات
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-destructive/5 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        منطقة الخطر
                    </CardTitle>
                    <CardDescription className="text-destructive/80">
                        الإجراءات هنا غير قابلة للتراجع. يرجى الحذر.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-background/50">
                        <div>
                            <h4 className="font-semibold text-destructive">حذف المعمل نهائياً</h4>
                            <p className="text-sm text-muted-foreground">
                                سيتم حذف المعمل وجميع البيانات المرتبطة به (المرضى، النتائج، المستخدمين) بشكل نهائي.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    حذف المعمل
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هذا الإجراء لا يمكن التراجع عنه. هذا سيحذف معمل 
                                        <span className="font-bold text-foreground"> {lab.name} </span>
                                        وجميع البيانات المرتبطة به نهائياً من الخوادم.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDelete}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                        {isDeleting ? "جاري الحذف..." : "نعم، احذف المعمل"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Left Column: User Management */}
        <div className="space-y-8">
            <div className="sticky top-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    المستخدمين
                </h3>
               <LabUserManagement labId={lab.uuid} />
            </div>
        </div>

      </div>
    </main>
  )
}
