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

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-500'
        case 'suspended': return 'bg-yellow-500'
        case 'inactive': return 'bg-gray-400'
        default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">إدارة المعامل</h1>
            <p className="text-muted-foreground mt-1 text-sm">إدارة كافة المعامل ({filteredLabs.length})</p>
        </div>
        <Link href="/manager/labs/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-sm">
            <Plus className="h-4 w-4" />
            معمل جديد
        </Link>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -my-4 mb-2 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="بحث سريع..." 
                    className="pr-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                <Filter className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                {['all', 'active', 'suspended', 'inactive'].map((status) => (
                    <Button
                        key={status}
                        variant={statusFilter === status ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className={`capitalize h-8 px-3 ${statusFilter === status ? 'font-semibold' : 'text-muted-foreground'}`}
                    >
                        {status === 'all' ? 'الكل' : 
                         status === 'active' ? 'نشط' : 
                         status === 'suspended' ? 'معلق' : 'غير نشط'}
                    </Button>
                ))}
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLabs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLabs.map((lab) => (
                <Card key={lab.uuid} className="group hover:shadow-lg transition-all duration-300 overflow-hidden relative border-muted/60">
                    <div className={`absolute top-0 right-0 w-1 h-full ${getStatusColor(lab.status)}`} />
                    
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground`}>
                                    {lab.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <Link href={`/manager/labs/${lab.uuid}`} className="hover:underline hover:text-primary transition-colors">
                                        <CardTitle className="text-base leading-none">{lab.name}</CardTitle>
                                    </Link>
                                    <p className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 rounded w-fit">
                                        /{lab.slug}
                                    </p>
                                </div>
                             </div>
                             
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -ml-2 opacity-50 group-hover:opacity-100">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link href={`/manager/labs/${lab.uuid}`}>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            الإعدادات
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`/${lab.slug}`} target="_blank">
                                        <DropdownMenuItem>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            فتح المعمل
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="flex items-center gap-2 mt-2">
                            <Link 
                                href={`/${lab.slug}`} 
                                target="_blank" 
                                className="flex-1"
                            >
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-muted/30 hover:bg-primary hover:text-primary-foreground border-muted transition-colors">
                                    <ExternalLink className="h-3 w-3 mr-1.5" />
                                    زيارة
                                </Button>
                            </Link>
                             <Link 
                                href={`/manager/labs/${lab.uuid}`}
                            >
                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                    <Settings className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium">لا توجد معامل</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                لم يتم العثور على أي معامل تطابق معايير البحث الخاصة بك. جرب تغيير الكلمات المفتاحية أو الفلاتر.
            </p>
            <Button 
                variant="outline" 
                onClick={() => {setSearchQuery(''); setStatusFilter('all')}}
                className="mt-6"
            >
                إعادة تعيين البحث
            </Button>
        </div>
      )}
    </div>
  )
}
