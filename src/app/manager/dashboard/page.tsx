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
import { 
    Loader2, 
    Plus, 
} from "lucide-react"
import { DashboardStats } from './components/DashboardStats'
import { OverviewChart } from './components/OverviewChart'
import { LabsList } from './components/LabsList'
import { CreateLabDialog } from '@/components/create-lab-dialog'


export default function ManagerDashboard() {
  const [data, setData] = useState<{
    labs: Lab[]
    stats: any
    chartData: any[]
    labStats: any[]
  }>({
    labs: [],
    stats: {},
    chartData: [],
    labStats: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // 1. Fetch Labs
    const { data: labsData } = await supabase
      .from('labs')
      .select('*')
      .order('created_at', { ascending: false })

    if (!labsData) {
        setIsLoading(false)
        return
    }

    // 2. Fetch Clients (limited to last 30 days for chart, and total count)
    // Note: Fetching ALL clients might be heavy. We'll use a summary strategy if possible,
    // but for now we'll fetch ID and created_at for all clients to do client-side aggregation
    // as we don't have aggregation functions exposed via RLS-friendly views yet.
    
    // 2. Fetch Clients (recursive for all data in last 30 days)
    // 2. Fetch Clients (recursive for all data in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let allClients: { lab_id: string, daily_date: string }[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
        const { data: clientsPage, error: clientsError } = await supabase
          .from('clients')
          .select('lab_id, daily_date')
          .gte('daily_date', thirtyDaysAgo.toISOString()) // Use daily_date filter
          .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (clientsError) {
            console.error("Error fetching clients page:", clientsError)
            break
        }

        if (clientsPage && clientsPage.length > 0) {
            allClients = [...allClients, ...clientsPage]
            if (clientsPage.length < pageSize) {
                hasMore = false
            } else {
                page++
            }
        } else {
            hasMore = false
        }
    }
    
    // Also fetch exact count for total stats separately to be safe
    const { count: totalClientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // Process Data using allClients
    const clientsData = allClients

    // Process Data
    const labs = labsData
    const activeLabs = labs.filter(l => l.status === 'active').length
    
    // Chart Data: Clients per day
    const chartMap = new Map<string, number>()
    // Initialize last 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        chartMap.set(d.toISOString().split('T')[0], 0)
    }

    // Lab Stats: Count per lab in last 30 days
    const labClientCounts: Record<string, number> = {}
    labs.forEach(l => labClientCounts[l.uuid] = 0)

    let newClientsLast30Days = 0

    clientsData?.forEach(client => {
        // Use daily_date instead of created_at
        const dateKey = new Date(client.daily_date).toISOString().split('T')[0]
        if (chartMap.has(dateKey)) {
            chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1)
        }
        
        if (labClientCounts[client.lab_id] !== undefined) {
            labClientCounts[client.lab_id]++
        }
        newClientsLast30Days++
    })

    // Format for Recharts
    const chartData = Array.from(chartMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))

    // Format Lab Stats
    const labStats = labs.map(lab => ({
        lab,
        clientCount: labClientCounts[lab.uuid] || 0
    }))

    setData({
        labs,
        stats: {
            totalLabs: labs.length,
            activeLabs,
            totalClients: totalClientsCount || 0,
            newClientsLast30Days
        },
        chartData,
        labStats
    })
    setIsLoading(false)
  }

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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">نظرة عامة</h1>
            <p className="text-muted-foreground mt-1">لوحة تحكم المدير - نظرة شاملة على أداء النظام</p>
        </div>
        <CreateLabDialog 
            onLabCreated={fetchData} 
        />
      </div>

      <DashboardStats 
        totalLabs={data.stats.totalLabs}
        activeLabs={data.stats.activeLabs}
        totalClients={data.stats.totalClients}
        newClientsLast30Days={data.stats.newClientsLast30Days}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <OverviewChart data={data.chartData} />
        <LabsList labs={data.labStats} />
      </div>
    </div>
  )
}

