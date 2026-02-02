"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"

interface LabUser {
  uuid: string
  user_id: string
  role: string
  status: string
  // @ts-ignore
  auth: {
      users: {
          email: string
      }
  }
}

interface LabUserManagementProps {
    labId: string;
}

export function LabUserManagement({ labId }: LabUserManagementProps) {
  const [users, setUsers] = useState<LabUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // User creation form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'lab_admin' | 'lab_staff' | 'lab_viewer'>('lab_staff')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (labId) fetchData()
  }, [labId])

  const fetchData = async () => {
    if (!labId) return;
    try {
        const res = await fetch(`/api/lab/users?labId=${labId}`);
        const result = await res.json();
        
        if (!res.ok) {
            console.error(result.error);
            return;
        }
        
        setUsers(result.users || []);
    } catch (e) {
        console.error("Failed to fetch users", e);
    } finally {
        setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!labId) return;

    setIsSubmitting(true)
    const trimmedEmail = email.trim();

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.rpc('add_lab_user_by_email', {
          p_lab_id: labId,
          p_email: trimmedEmail,
          p_role: role
      });

      if (error) {
        // If user not found, try to create them via API
        if (error.message && (error.message.includes('not found') || error.message.includes('User with email'))) {
            if (!password) {
                const pass = prompt('المستخدم غير موجود. الرجاء إدخال كلمة المرور لإنشاء حساب جديد:', '');
                if (!pass) {
                    throw new Error('كلمة المرور مطلوبة لإنشاء مستخدم جديد');
                }
                setPassword(pass);
                // Recursive call? No, better to continue here with the captured pass
                // But prompt is blocking, so we can use 'pass' variable.
                await createUserViaApi(trimmedEmail, pass);
            } else {
                await createUserViaApi(trimmedEmail, password);
            }
        } else {
            throw error;
        }
      } else {
          alert('تم إضافة المستخدم بنجاح')
      }

      setEmail('')
      setPassword('')
      fetchData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error.message || 'حدث خطأ أثناء إضافة المستخدم')
    } finally {
      setIsSubmitting(false)
    }
  }

  const createUserViaApi = async (email: string, pass: string) => {
        const res = await fetch('/api/lab/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, role, labId })
        });

        const apiData = await res.json();

        if (!res.ok) {
            throw new Error(apiData.error || 'Failed to create user');
        }

        alert('تم إنشاء المستخدم وإضافته بنجاح');
  }

  const handleRemoveUser = async (userId: string) => {
    if (!labId) return;
    if (!confirm('هل أنت متأكد من إزالة هذا المستخدم؟')) return
    
    const supabase = createClient()
    // Permanently remove or set to inactive? 
    // Usually hard delete for link table is fine, or soft delete.
    // The previous code did update status=inactive. Let's stick to that or delete.
    // Given the task says "Remove", I will try DELETE first as per my plan, 
    // but the previous code had update. Let's do DELETE to be clean.
    const { error } = await supabase
      .from('lab_users')
      .delete()
      .eq('user_id', userId)
      .eq('lab_id', labId)

    if (error) {
        console.error(error);
        alert('فشل الحذف');
    } else {
        fetchData()
    }
  }

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           <CardTitle className="text-lg">إضافة مستخدم جديد</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    dir="ltr"
                />
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور (اختياري، للمستخدمين الجدد)"
                    dir="ltr"
                />
                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="الدور" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lab_admin">مسؤول المعمل</SelectItem>
                        <SelectItem value="lab_staff">موظف</SelectItem>
                        <SelectItem value="lab_viewer">مشاهد</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الإضافة...
                    </>
                ) : 'إضافة مستخدم'}
            </Button>
            </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <CardTitle className="text-lg">المستخدمون الحاليون</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
            {users.map((user) => (
                <div key={user.uuid} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                <div>
                    {/* @ts-ignore */}
                    <p className="font-medium" dir="ltr">{user.auth?.users?.email || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                    {user.role === 'lab_admin' ? 'مسؤول معمل' : user.role === 'lab_staff' ? 'موظف' : 'مشاهد'}
                    <span className="mx-2">•</span>
                    <span className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                        {user.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveUser(user.user_id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                </div>
            ))}
            {users.length === 0 && <p className="text-center text-muted-foreground">لا يوجد مستخدمين</p>}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
