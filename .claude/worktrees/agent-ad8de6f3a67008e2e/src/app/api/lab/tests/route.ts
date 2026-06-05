import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Helper: get admin client (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// DELETE /api/lab/tests?uuid=<uuid>
// Soft-deletes a global lab test (is_active = false).
// Requires the caller to be an authenticated manager or lab_admin.
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
    }

    // Verify the caller is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the caller is a manager or lab_admin in at least one active lab
    const { data: memberRecord } = await supabase
      .from("lab_users")
      .select("role, is_manager")
      .eq("user_id", user.id)
      .eq("status", "active")
      .or("is_manager.eq.true,role.eq.lab_admin")
      .limit(1)
      .maybeSingle();

    if (!memberRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass the RLS WITH CHECK constraint
    const supabaseAdmin = getAdminClient();

    const { error } = await supabaseAdmin
      .from("lab_tests")
      .update({ is_active: false })
      .eq("uuid", uuid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (DELETE /api/lab/tests):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
