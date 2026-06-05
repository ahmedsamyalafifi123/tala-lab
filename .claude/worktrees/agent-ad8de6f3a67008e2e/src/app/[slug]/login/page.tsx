"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from "next/image"
import { createClient } from '@/lib/supabase'
import { useLabContext } from '@/contexts/LabContext'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LabLoginPage() {
  const params = useParams()
  const router = useRouter()
  const { setLabContext } = useLabContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [labName, setLabName] = useState('')
  const [error, setError] = useState('')
  
  const slug = params.slug as string;

  useEffect(() => {
    // Fetch lab info for display
    const fetchLabInfo = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('labs')
        .select('uuid, name')
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

      if (data) {
        setLabName(data.name)
        // Store lab context for after login
        setLabContext(slug, data.uuid)
      }
    }
    fetchLabInfo()
  }, [slug, setLabContext])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        throw authError
      }

      // Check if user has access to this lab
      // We need to fetch the LAB UUID first from slug
      const { data: labData } = await supabase.from('labs').select('uuid').eq('slug', slug).single()
      
      if (!labData) throw new Error('Lab not found');

      const { data: labUser, error: labUserError } = await supabase
        .from('lab_users')
        .select('lab_id, role, status')
        .eq('user_id', authData.user.id)
        .eq('lab_id', labData.uuid)
        .single()

      if (labUserError || !labUser || labUser.status !== 'active') {
        setError('ليس لديك صلاحية للوصول إلى هذا المعمل')
        await supabase.auth.signOut()
        return
      }

      router.push(`/${slug}`)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
       <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
             <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="rounded-2xl mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <CardTitle className="text-2xl">{labName || 'تسجيل الدخول'}</CardTitle>
            <CardDescription className="mt-2">تسجيل الدخول إلى المعمل</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
            {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center">
                {error}
            </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-12"
                dir="ltr"
                />
            </div>
            <div className="space-y-2">
                 <Label>كلمة المرور</Label>
                <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                dir="ltr"
                />
            </div>
            
            <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري الدخول...
                    </span>
                ) : 'تسجيل الدخول'}
            </Button>
            </form>

            <div className="mt-6 text-center">
                <a href="/login" className="text-sm text-muted-foreground hover:underline">
                    العودة للصفحة الرئيسية
                </a>
            </div>
        </CardContent>
      </Card>
    </main>
  )
}
