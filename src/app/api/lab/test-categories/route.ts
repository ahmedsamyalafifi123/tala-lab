import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// DELETE /api/lab/test-categories?uuid=<uuid>
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get("uuid");

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid || !UUID_RE.test(uuid)) {
      return NextResponse.json({ error: "Invalid uuid" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be a manager or lab_admin
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

    const { error } = await getAdminClient()
      .from("lab_test_categories")
      .update({ is_active: false })
      .eq("uuid", uuid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error (DELETE /api/lab/test-categories):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
