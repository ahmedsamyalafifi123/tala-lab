"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check user role/lab and redirect accordingly
      
      // 1. Check if manager
      const { data: manager } = await supabase
        .from("lab_users")
        .select("is_manager")
        .eq("user_id", authData.user.id)
        .eq("is_manager", true)
        .eq("status", "active")
        .single();

      if (manager) {
        router.push("/manager/dashboard");
        return;
      }

      // 2. If not manager, get their lab
      const { data: labUser } = await supabase
        .from("lab_users")
        .select("lab_id, labs(slug)")
        .eq("user_id", authData.user.id)
        .eq("status", "active")
        .single();

      if (labUser && labUser.labs) {
        // @ts-ignore
        router.push(`/${labUser.labs.slug}`);
      } else {
        throw new Error("لا يوجد معمل نشط مرتبط بهذا الحساب");
      }

    } catch (err) {
      console.error(err);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
             {/* Use a placeholder request if image is missing, or keep current. current is /logo.png */}
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="rounded-2xl mx-auto"
              onError={(e) => {
                // Fallback if logo doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <CardTitle className="text-2xl">منصة إدارة المعامل</CardTitle>
            <CardDescription className="mt-2">
              تسجيل الدخول للمدراء
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-12"
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm bg-destructive/20 text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري التحميل...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
