import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, role, labId } = await req.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
    }

    // Need Service Role Key to bypass RLS and create users
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

    // Create user in Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    // Link user to lab in lab_users table
    const { error: dbError } = await supabaseAdmin.from("lab_users").insert({
      lab_id: labId,
      user_id: authData.user.id,
      role: role,
      status: "active",
      // is_manager: false (default)
    });

    if (dbError) {
        // Rollback auth user creation if db fails? 
        // For simplicity, we just return error, but ideally we should cleanup.
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
