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

  if (!lab) {
    redirect('/login?error=invalid_lab')
  }

  // Fetch current user's role regardless of lab status
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = null;
  
  if (user) {
      const { data: labUser } = await supabase
        .from('lab_users')
        .select('role, is_manager, status')
        .eq('user_id', user.id)
        .eq('lab_id', lab.uuid)
        .eq('status', 'active')
        .single()
        
      if (labUser) {
          userRole = labUser.role;
          if (labUser.is_manager) {
              userRole = 'lab_admin';
          }
      }
  }

  // If lab is not active, check if user is a manager of this lab
  if (lab.status !== 'active') {
    let isAllowed = false;
    
    if (user && userRole) {
      // Check for manager status specifically for this lab
      // We already fetched labUser above.
      // Re-fetch logic or reuse? Reuse.
      // We need is_manager specifically which we fetched.
       const { data: labUser } = await supabase
        .from('lab_users')
        .select('is_manager')
        .eq('user_id', user.id)
        .eq('lab_id', lab.uuid)
        .eq('status', 'active')
        .single()
        
      if (labUser && labUser.is_manager) {
        isAllowed = true;
      }
    }
    
    // If not allowed (not a manager or not logged in), redirect
    if (!isAllowed) {
      redirect('/login?error=invalid_lab')
    }
  }

  return (
    <LabProvider initialLabId={lab.uuid} initialLabSlug={lab.slug} initialUserRole={userRole || undefined}>
      <div data-lab-id={lab.uuid} data-lab-slug={lab.slug} className="min-h-screen bg-background">
        {children}
      </div>
    </LabProvider>
  )
}
