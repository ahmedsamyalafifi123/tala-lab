import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, role, labId } = await req.json();

    if (!email || !password || !role || !labId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const trimmedEmail = email.trim();

    // Check Permissions: User must be a manager or lab_admin of this lab
    const { data: memberRecord } = await supabase.from('lab_users')
        .select('role, is_manager')
        .eq('lab_id', labId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
        
    const isAuthorized = memberRecord && (memberRecord.is_manager || memberRecord.role === 'lab_admin');

    if (!isAuthorized) {
        return NextResponse.json({ error: "Not authorized to add users to this lab" }, { status: 403 });
    }

    // Initialize Service Role Client
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

    let targetUserId;
    
    // 1. Create User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password: password,
        email_confirm: true
    });

    if (authError) {
        // If user already exists, we return an error because the frontend should have caught this
        // via the RPC call (add_lab_user_by_email) BEFORE calling this API.
        // If we want to support "linking via password" implicitly, we cannot because we don't know the password matches.
        
        throw authError; // "User already registered" or other error
    }

    targetUserId = authData.user.id;

    // 2. Add to Lab Users
    const { error: dbError } = await supabaseAdmin.from("lab_users").upsert({
      lab_id: labId,
      user_id: targetUserId,
      role: role,
      status: "active",
      created_by: user.id
    }, { onConflict: 'lab_id, user_id' });

    if (dbError) {
        // Cleanup: delete user if db insert fails? 
        // For now, let's keep it simple.
        throw dbError;
    }

    return NextResponse.json({ success: true, userId: targetUserId });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
