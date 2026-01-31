"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Lab } from '@/types'
import Link from 'next/link'
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Loader2, 
    Plus, 
    Activity, 
    Users, 
    FlaskConical, 
    ExternalLink, 
    Settings,
    Search
} from "lucide-react"

export default function ManagerDashboard() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [stats, setStats] = useState({ totalLabs: 0, totalClients: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch all labs
    const { data: labsData } = await supabase
      .from('labs')
      .select('*')
      .order('created_at', { ascending: false })

    setLabs(labsData || [])

    // Fetch total clients count
    // Note: RLS might restrict this count for managers if not explicitly allowed.
    // Proceeding with best effort as per plan.
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalLabs: labsData?.length || 0,
      totalClients: count || 0,
    })

    setIsLoading(false)
  }

  const activeLabs = labs.filter(l => l.status === 'active').length

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
            <p className="text-muted-foreground mt-1">مرحباً بك في لوحة تحكم المدير</p>
        </div>
        <Link href="/manager/labs/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-lg">
            <Plus className="h-4 w-4" />
            إنشاء معمل جديد
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعامل</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLabs}</div>
            <p className="text-xs text-muted-foreground">معمل مسجل في النظام</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعامل النشطة</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeLabs}</div>
             <p className="text-xs text-muted-foreground">معامل تعمل حالياً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">مريض مسجل عبر جميع المعامل</p>
          </CardContent>
        </Card>
      </div>

      {/* Labs List */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">المعامل الأخيرة</h2>
            <Button variant="outline" size="sm" className="hidden sm:flex">
                <Search className="mr-2 h-4 w-4" />
                بحث وتصفية
            </Button>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {labs.map((lab) => (
                <Card key={lab.uuid} className="group hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: lab.status === 'active' ? '#22c55e' : lab.status === 'suspended' ? '#eab308' : '#9ca3af' }}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{lab.name}</CardTitle>
                                <CardDescription className="font-mono text-xs mt-1 bg-muted px-2 py-1 rounded w-fit">
                                    /{lab.slug}
                                </CardDescription>
                            </div>
                            <Badge variant={
                                lab.status === 'active' ? 'default' : 
                                lab.status === 'suspended' ? 'secondary' : 'outline'
                            } className={
                                lab.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300' : 
                                lab.status === 'suspended' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300' : ''
                            }>
                                {lab.status === 'active' ? 'نشط' : lab.status === 'suspended' ? 'معلق' : 'غير نشط'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mt-2">
                            <Link 
                                href={`/${lab.slug}`} 
                                target="_blank" 
                                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground h-9 px-4 py-2 w-full"
                            >
                                <ExternalLink className="h-4 w-4" />
                                فتح المعمل
                            </Link>
                            <Link 
                                href={`/manager/labs/${lab.uuid}`}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 w-9"
                                title="الإعدادات"
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        {labs.length === 0 && (
             <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-muted-foreground">لا توجد معامل حتى الآن</h3>
                <Link href="/manager/labs/new" className="mt-4 inline-block">
                    <Button variant="link">إنشاء أول معمل لك &rarr;</Button>
                </Link>
             </div>
        )}
      </div>
    </div>
  )
}

