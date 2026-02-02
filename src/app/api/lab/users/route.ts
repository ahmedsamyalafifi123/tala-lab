import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get("labId");

    if (!labId) {
      return NextResponse.json({ error: "Missing labId" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Permissions
    const { data: memberRecord } = await supabase.from('lab_users')
        .select('role, is_manager')
        .eq('lab_id', labId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
        
    const isAuthorized = memberRecord && (memberRecord.is_manager || memberRecord.role === 'lab_admin');

    if (!isAuthorized) {
        return NextResponse.json({ error: "Not authorized to view users of this lab" }, { status: 403 });
    }

    // Use Admin Client to fetch users + emails
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch lab_users WITHOUT join
    const { data: labUsers, error: dbError } = await supabaseAdmin
      .from('lab_users')
      .select('*')
      .eq('lab_id', labId);
      
    if (dbError) throw dbError;

    // 2. Fetch all users from Auth (or just the ones we need)
    // Ideally listUsersByIds would be great but Supabase JS doesn't have it exposed easily yet?
    // We can use listUsers() which is paginated 50 by default. If we have few users it's fine.
    // But if we have huge number, it's slow.
    // However, for a single lab, number of users is likely small (< 100).
    
    // Better strategy for multiple users:
    // Loop and fetch? No.
    // listUsers() gives us everything.
    // If we have access to direct postgres connection we could join, but here we are using HTTP client.
    
    // Let's assume listUsers() is acceptable for now or simple "get user by id" in parallel?
    // Parallel getUserById might be rate limited.
    
    // Let's try listUsers with some efficiency if possible.
    // Actually, we can just map over labUsers and append the email if we find it in listUsers.
    
    // NOTE: listUsers returns *all* users in project. This is bad if we have 10k users.
    // Alternative: We only have the userId.
    
    const { data: { users: allAuthUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000 // Reasonable limit for now
    });
    
    if (authError) throw authError;

    // 3. Merge data
    const labUsersWithEmail = labUsers.map(lu => {
        const authUser = allAuthUsers.find(u => u.id === lu.user_id);
        return {
            ...lu,
            auth: {
                users: {
                    email: authUser?.email || 'Unknown'
                }
            }
        };
    });

    return NextResponse.json({ users: labUsersWithEmail });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
