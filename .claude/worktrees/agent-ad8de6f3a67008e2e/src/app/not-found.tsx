"use client"

import Link from 'next/link'

import { Button } from "@/components/ui/button"
import { FileQuestion, Home, ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-8 bg-background animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex justify-center mb-6">
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                <FileQuestion className="h-16 w-16 text-muted-foreground" />
            </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">404</h1>
        <h2 className="text-2xl font-semibold tracking-tight">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            الرئيسية
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
          <ArrowRight className="h-4 w-4" />
          العودة للخلف
        </Button>
      </div>
    </div>
  )
}
