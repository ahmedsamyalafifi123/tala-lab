"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lab } from "@/types"
import { ExternalLink, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface LabsListProps {
  labs: ({
      lab: Lab
      clientCount: number // Last 30 days or total
  })[]
}

export function LabsList({ labs }: LabsListProps) {
  // Sort by client count desc
  const sortedLabs = [...labs].sort((a, b) => b.clientCount - a.clientCount).slice(0, 5)

  return (
    <Card className="col-span-4 lg:col-span-1 border-none shadow-md">
      <CardHeader>
        <CardTitle>الأكثر نشاطاً</CardTitle>
        <CardDescription>
          أعلى 5 معامل نشاطاً هذا الشهر
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {sortedLabs.map((item, index) => (
                <div key={item.lab.uuid} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className={`
                                ${index === 0 ? 'bg-yellow-500/10 text-yellow-600' : 
                                  index === 1 ? 'bg-gray-500/10 text-gray-400' :
                                  index === 2 ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'}
                            `}>
                                {index + 1}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{item.lab.name}</p>
                            <p className="text-xs text-muted-foreground">{item.lab.slug}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="font-bold text-sm">
                            {item.clientCount} <span className="text-muted-foreground font-normal text-xs">مريض</span>
                        </div>
                        <Link href={`/${item.lab.slug}`} target="_blank">
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
            
            {sortedLabs.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                    لا توجد بيانات
                </div>
            )}

            <Link href="/manager/labs" className="block w-full">
                <Button variant="outline" className="w-full mt-2">
                    عرض جميع المعامل
                </Button>
            </Link>
        </div>
      </CardContent>
    </Card>
  )
}
