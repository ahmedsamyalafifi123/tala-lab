"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lab } from '@/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"
import { LabUserManagement } from "@/components/lab-user-management"

export default function LabDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lab, setLab] = useState<Lab | null>(null)
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

        {/* User Management Section */}
        <LabUserManagement labId={lab.uuid} />

      </div>
    </main>
  )
}
