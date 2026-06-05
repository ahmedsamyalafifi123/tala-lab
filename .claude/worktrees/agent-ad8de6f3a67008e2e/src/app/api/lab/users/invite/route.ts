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

    const { email, role, labId } = await req.json();

    if (!email || !role || !labId) {
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
    
    // 1. Try to Invite User
    // This will send an invitation email if configured, and create the user in Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmedEmail);

    if (inviteError) {
        // Check if user already exists
        if (inviteError.message && (inviteError.message.includes("already registered") || inviteError.status === 400 || inviteError.status === 422)) {
             // If user exists, we cannot get their ID easily via Admin API without listUsers.
             // But wait! If they exist, the RPC `add_lab_user_by_email` presumably failed before calling this API?
             // Or maybe we want this API to handle BOTH cases (add existing OR invite new)?
             // If the Frontend calls this API *only* when RPC fails "Not Found", then this branch (User Exists) is unlikely unless race condition.
             
             // However, to be robust, let's try to handle "User Exists".
             // We can assume they exist and try to fetch their ID via `listUsers` (filtered by email if possible otherwise we are stuck).
             // `listUsers` doesn't filter.
             
             // Wait, if they exist, we can ask the Caller (Manager) to just "Add" them?
             // But the caller tried and failed?
             // If caller tried and failed validation "User not found", then it's correct to Invite.
             // If Invite says "Already Registered", then "User not found" was WRONG or they signed up 1 second ago.
             
             // Simplest fallback: If verify they exist, return error "User exists but could not be added. Please ask them to provide their User ID" (bad UX).
             
             // Let's assume Invite works for new users.
             console.error("Invite failed:", inviteError);
             return NextResponse.json({ error: inviteError.message || "Failed to invite user" }, { status: 400 });
        }
        throw inviteError;
    }

    targetUserId = inviteData.user.id;

    // 2. Add to Lab Users
    // We use upsert to be safe, though insert is fine for new user.
    const { error: dbError } = await supabaseAdmin.from("lab_users").upsert({
      lab_id: labId,
      user_id: targetUserId,
      role: role,
      status: "active",
      created_by: user.id
    }, { onConflict: 'lab_id, user_id' });

    if (dbError) {
        throw dbError;
    }

    return NextResponse.json({ success: true, userId: targetUserId });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
