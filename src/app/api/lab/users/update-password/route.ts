import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Sets a new password for an existing auth user while linking them to a lab.
 * Called after add_lab_user_by_email succeeds so the password typed in
 * إضافة مستخدم is always what logs in — for new accounts the create route
 * already applies it, this covers accounts that existed before the link.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, password, labId } = await req.json();

    if (!userId || !password || !labId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    // Check Permissions: User must be a manager or lab_admin of this lab
    const { data: memberRecord } = await supabase.from('lab_users')
        .select('role, is_manager')
        .eq('lab_id', labId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    const isAuthorized = memberRecord && (memberRecord.is_manager || memberRecord.role === 'lab_admin');

    if (!isAuthorized) {
        return NextResponse.json({ error: "Not authorized to update users in this lab" }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });

    if (updateError) {
        throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user password:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
