import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create server client
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
}

// Get user's current lab context
export async function getUserLabContext(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("lab_users")
    .select(
      `
      lab_id,
      role,
      is_manager,
      labs (
        uuid,
        slug,
        name,
        name_en,
        logo_url,
        status
      )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    labId: data.lab_id,
    role: data.role,
    isManager: data.is_manager,
    lab: data.labs,
  };
}

// Get all labs for a manager user
export async function getManagerLabs(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("lab_users")
    .select("lab_id, role, labs(*)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      ...item.labs,
      userRole: item.role,
    })) || []
  );
}

// Check if user is a manager
export async function isManagerUser(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("lab_users")
    .select("is_manager")
    .eq("user_id", userId)
    .eq("is_manager", true)
    .eq("status", "active")
    .single();

  return !!data;
}
