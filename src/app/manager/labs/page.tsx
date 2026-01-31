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
import { Input } from "@/components/ui/input"
import { 
    Loader2, 
    Plus, 
    Search, 
    ExternalLink, 
    Settings,
    MoreVertical,
    Filter
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [filteredLabs, setFilteredLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchLabs()
  }, [])

  useEffect(() => {
    let result = labs

    // Filter by search
    if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = result.filter(lab => 
            lab.name.toLowerCase().includes(query) || 
            lab.slug.toLowerCase().includes(query)
        )
    }

    // Filter by status
    if (statusFilter !== 'all') {
        result = result.filter(lab => lab.status === statusFilter)
    }

    setFilteredLabs(result)
  }, [searchQuery, statusFilter, labs])

  const fetchLabs = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('labs')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
        setLabs(data)
        setFilteredLabs(data)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة المعامل</h1>
            <p className="text-muted-foreground mt-1">عرض وإدارة جميع المعامل المسجلة في النظام</p>
        </div>
        <Link href="/manager/labs/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-sm">
            <Plus className="h-4 w-4" />
            إنشاء معمل جديد
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="بحث باسم المعمل أو الرابط..." 
                className="pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
             <Button 
                variant={statusFilter === 'all' ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setStatusFilter('all')}
            >
                الكل
            </Button>
            <Button 
                variant={statusFilter === 'active' ? "secondary" : "ghost"} 
                size="sm"
                className="text-green-600"
                onClick={() => setStatusFilter('active')}
            >
                نشط
            </Button>
            <Button 
                variant={statusFilter === 'suspended' ? "secondary" : "ghost"} 
                size="sm" 
                 className="text-yellow-600"
                onClick={() => setStatusFilter('suspended')}
            >
                معلق
            </Button>
             <Button 
                variant={statusFilter === 'inactive' ? "secondary" : "ghost"} 
                size="sm"
                 className="text-gray-500"
                onClick={() => setStatusFilter('inactive')}
            >
                غير نشط
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLabs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
                <Card key={lab.uuid} className="group hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                    lab.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                    'bg-secondary text-secondary-foreground'
                                }`}>
                                    {lab.name.charAt(0)}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                                    <CardDescription className="font-mono text-xs">
                                        /{lab.slug}
                                    </CardDescription>
                                </div>
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
                        <div className="flex gap-2">
                             <Link 
                                href={`/${lab.slug}`} 
                                target="_blank" 
                                className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full"
                             >
                                    <ExternalLink className="h-4 w-4" />
                                    زيارة
                            </Link>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                    <Link href={`/manager/labs/${lab.uuid}`}>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            إعدادات المعمل
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                        حذف المعمل
                                        {/* TODO: Add delete confirmation logic */}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">لا توجد نتائج</h3>
            <p className="text-muted-foreground mt-1">للاسف، لم يتم العثور على معامل تطابق بحثك.</p>
            <Button 
                variant="link" 
                onClick={() => {setSearchQuery(''); setStatusFilter('all')}}
                className="mt-2"
            >
                محو عوامل التصفية
            </Button>
        </div>
      )}
    </div>
  )
}
