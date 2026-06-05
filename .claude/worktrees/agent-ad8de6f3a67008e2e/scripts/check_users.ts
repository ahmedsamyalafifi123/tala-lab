
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    console.log("Checking users...");

    // 1. Emulate the API Query
    const labId = '76ea2f3b-b705-4d48-abd3-dfec8fa419a3'; // From user request logs
    
    console.log(`Querying for labId: ${labId}`);

    const { data: labUsers, error } = await supabase
      .from('lab_users')
      .select('*, auth:user_id(email)') // This is the suspicious part
      .eq('lab_id', labId)
      // .eq('status', 'active') // Remove this temporarily to see all
      
    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log(`Query returned ${labUsers.length} rows`);
        console.log("Sample row:", labUsers[0]);
    }
    
    // 2. Try fetching without join
    const { data: simpleUsers } = await supabase.from('lab_users').select('*').eq('lab_id', labId);
    console.log(`Simple Query returned ${simpleUsers?.length} rows`);
    if (simpleUsers && simpleUsers.length > 0) {
        console.log("First simple user ID:", simpleUsers[0].user_id);
        
        // Check if this user exists in Auth
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(simpleUsers[0].user_id);
        if (authError) {
             console.error("Auth Admin GetUser Error:", authError);
        } else {
             console.log("Auth Admin User found:", user?.email);
        }
    }
}

checkUsers();
