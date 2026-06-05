"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, FlaskConical, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  totalLabs: number
  activeLabs: number
  totalClients: number
  newClientsLast30Days: number
  growthRate?: number // percentage
}

export function DashboardStats({
  totalLabs,
  activeLabs,
  totalClients,
  newClientsLast30Days,
  growthRate = 0
}: DashboardStatsProps) {
  
  const stats = [
    {
      title: "إجمالي المعامل",
      value: totalLabs,
      description: "معمل مسجل",
      icon: FlaskConical,
      color: "text-blue-500",
      trend: `${activeLabs} نشط`,
      trendColor: "text-green-500"
    },
    {
      title: "إجمالي المرضى",
      value: totalClients.toLocaleString(),
      description: "مريض مسجل",
      icon: Users,
      color: "text-indigo-500",
    },
    {
      title: "مرضى آخر 30 يوم",
      value: newClientsLast30Days.toLocaleString(),
      description: "زيارة جديدة",
      icon: Activity,
      color: "text-purple-500",
      trend: growthRate !== 0 ? `${growthRate > 0 ? '+' : ''}${growthRate}%` : undefined,
      trendColor: growthRate > 0 ? "text-green-500" : "text-red-500",
      trendIcon: growthRate > 0 ? TrendingUp : TrendingDown
    },
    {
        title: "متوسط الزيارات",
        value: totalLabs > 0 ? Math.round(newClientsLast30Days / 30).toLocaleString() : 0,
        description: "يومياً (الكل)",
        icon: Clock,
        color: "text-orange-500",
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden relative border-none shadow-md bg-gradient-to-br from-card to-card/50 dark:from-card dark:to-background">
            <div className={`absolute right-0 top-0 h-full w-1 ${stat.color} bg-current opacity-20`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {stat.trend && (
                         <span className={cn("flex items-center font-medium mr-1", stat.trendColor)}>
                            {stat.trendIcon && <stat.trendIcon className="mr-1 h-3 w-3" />}
                            {stat.trend}
                        </span>
                    )}
                    <span>{stat.description}</span>
                </div>
            </CardContent>
        </Card>
      ))}
    </div>
  )
}
