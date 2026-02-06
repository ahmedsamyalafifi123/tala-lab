"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import {
  LayoutDashboard,
  FlaskConical,
  LogOut,
  Menu,
  Settings,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    {
      title: "لوحة التحكم",
      href: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
        title: "المعامل",
        href: "/manager/labs",
        icon: FlaskConical
    },
    {
        title: "التحاليل والفحوصات",
        href: "/manager/tests",
        icon: Settings
    }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 flex items-center justify-center border-b">
         <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="rounded-xl"
            onError={(e) => {
            e.currentTarget.style.display = 'none';
            }}
        />
        <span className="mr-3 font-bold text-lg">لوحة المدير</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
                <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex w-full items-center justify-start gap-4 mb-2 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${isActive ? "bg-secondary text-secondary-foreground" : ""}`}
                >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                </Link>
             )
        })}
      </div>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center justify-between px-2">
            <span className="text-sm text-muted-foreground">المظهر</span>
            <ThemeToggle />
        </div>
        <Button 
            variant="destructive" 
            className="w-full justify-start gap-4"
            onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-l fixed inset-y-0 right-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
             <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-lg"
                 onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
            <span className="font-bold">لوحة المدير</span>
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-l">
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
