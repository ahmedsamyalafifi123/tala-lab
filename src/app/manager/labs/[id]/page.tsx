"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lab } from '@/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"

export default function LabDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lab, setLab] = useState<Lab | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLabDetails()
  }, [params.id])

  const fetchLabDetails = async () => {
    const supabase = createClient()

    // Fetch lab details
    const { data: labData } = await supabase
      .from('labs')
      .select('*')
      .eq('uuid', params.id)
      .single()

    setLab(labData)

    // Fetch lab users
    const { data: usersData } = await supabase
      .from('lab_users')
      .select('*, auth.users(id, email)')
      .eq('lab_id', params.id)

    setUsers(usersData || [])
    setIsLoading(false)
  }

  const updateLabStatus = async (status: 'active' | 'suspended' | 'inactive') => {
    const supabase = createClient()
    await supabase
      .from('labs')
      .update({ status })
      .eq('uuid', params.id)

    fetchLabDetails()
  }

  if (isLoading) {
    return (
        <main className="min-h-screen p-8 flex justify-center items-center">
             <Loader2 className="h-8 w-8 animate-spin" />
        </main>
    )
  }

  if (!lab) {
    return <main className="min-h-screen p-8">المعمل غير موجود</main>
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <Button
            variant="ghost"
          onClick={() => router.push('/manager/dashboard')}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للوحة المدير
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{lab.name}</h1>
            <Button variant="outline" onClick={() => window.open(`/${lab.slug}`, '_blank')}>
                زيارة المعمل
            </Button>
        </div>

        <Card>
          <CardHeader>
             <CardTitle className="text-lg">إعدادات المعمل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">الحالة</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={lab.status === 'active' ? 'default' : 'outline'}
                  onClick={() => updateLabStatus('active')}
                  className={lab.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  نشط
                </Button>
                <Button
                  size="sm"
                  variant={lab.status === 'suspended' ? 'default' : 'outline'}
                  onClick={() => updateLabStatus('suspended')}
                  className={lab.status === 'suspended' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  معلق
                </Button>
                <Button
                  size="sm"
                  variant={lab.status === 'inactive' ? 'default' : 'outline'}
                  onClick={() => updateLabStatus('inactive')}
                  className={lab.status === 'inactive' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                >
                  غير نشط
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">الرابط</label>
              <p className="font-mono bg-muted p-2 rounded mt-1" dir="ltr">/{lab.slug}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg">المستخدمون</CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {users.map((user) => (
                <div key={user.uuid} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                  {/* @ts-ignore */}
                  <span className="font-medium" dir="ltr">{user.auth?.users?.email || 'Unknown'}</span>
                  <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1 bg-background border rounded">
                        {user.role}
                      </span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" className="w-full">
              + إضافة مستخدم (قريباً)
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
                يمكنك إضافة مستخدمين من داخل لوحة تحكم المعمل
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
