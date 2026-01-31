import { LabProvider } from '@/contexts/LabContext'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LabLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseClient()

  // Get lab details
  const { data: lab } = await supabase
    .from('labs')
    .select('uuid, slug, name, status')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!lab || lab.status !== 'active') {
    // If it's a 404-like URL, strict mode redirects to login invalid lab
    // But if it's the login page itself inside the lab layout, we might handle it differently?
    // Wait, the layout wraps the login page too (/[slug]/login/page.tsx).
    // So we need to allow access if it's the login page, BUT we definitely need the LabProvider.
    // However, if the LAB doesn't exist, we can't provide a context.
    
    // So if lab doesn't exist, we must error out.
    redirect('/login?error=invalid_lab')
  }

  return (
    <LabProvider initialLabId={lab.uuid} initialLabSlug={lab.slug}>
      <div data-lab-id={lab.uuid} data-lab-slug={lab.slug} className="min-h-screen bg-background">
        {children}
      </div>
    </LabProvider>
  )
}
