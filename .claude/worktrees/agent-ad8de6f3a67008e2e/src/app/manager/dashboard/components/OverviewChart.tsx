"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { useTheme } from "next-themes"

interface OverviewChartProps {
  data: {
    date: string
    value: number
    labName?: string
  }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
    const { theme } = useTheme()
    const isDark = theme === "dark"

  return (
    <Card className="col-span-4 lg:col-span-3 border-none shadow-md bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle>تحليل الزيارات</CardTitle>
        <CardDescription>
          نظرة عامة على عدد الزيارات في آخر 30 يوم لجميع المعامل
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                />
                <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: isDark ? "#1f2937" : "#fff", 
                        borderRadius: "8px", 
                        border: "none", 
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" 
                    }}
                    labelStyle={{ color: isDark ? "#fff" : "#000", marginBottom: "0.25rem" }}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    strokeWidth={2}
                    name="الزيارات"
                />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
