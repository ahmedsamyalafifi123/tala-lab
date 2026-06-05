// ============================================================================
// COPY THIS TO BROWSER CONSOLE (F12 → Console Tab)
// This will help us see exactly what data the frontend is receiving
// ============================================================================

// Step 1: Check what clients array contains
console.log('=== CHECKING CLIENTS DATA ===');
console.log('Total clients in state:', window.location.href);

// Step 2: Force a data check from the DOM
const tableRows = document.querySelectorAll('table tbody tr');
console.log('Total visible table rows:', tableRows.length);

// Step 3: Check for flask icons in DOM
const flaskIcons = document.querySelectorAll('[data-lucide="flask-conical"], svg.lucide-flask-conical');
console.log('Flask icons found in DOM:', flaskIcons.length);

// Step 4: Direct Supabase query test
console.log('\n=== TESTING DIRECT SUPABASE QUERY ===');
console.log('Run this command next:');
console.log(`
// Import supabase
const { createClient } = await import('/src/lib/supabase.js');
const supabase = createClient();

// Get your lab_id from localStorage
const labId = localStorage.getItem('labId'); // or check sessionStorage
console.log('Lab ID:', labId);

// Query clients
const { data, error } = await supabase
  .from('clients')
  .select('uuid, patient_name, selected_tests')
  .eq('lab_id', labId)
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Query error:', error);
} else {
  console.log('Recent clients with selected_tests:');
  data.forEach(client => {
    console.log({
      name: client.patient_name,
      has_selected_tests: !!client.selected_tests,
      selected_tests: client.selected_tests,
      test_count: client.selected_tests?.length || 0
    });
  });
}
`);

// Step 5: Check React state (if DevTools available)
console.log('\n=== IF YOU HAVE REACT DEVTOOLS ===');
console.log('1. Open React DevTools');
console.log('2. Select the LabDashboard component');
console.log('3. Look at the "clients" state');
console.log('4. Expand a client object and check if "selected_tests" field exists');

console.log('\n=== WHAT TO LOOK FOR ===');
console.log('✅ If selected_tests appears in query results → Database is working');
console.log('❌ If selected_tests is missing or null → Database issue');
console.log('✅ If Flask icons found > 0 → UI is rendering (check CSS)');
console.log('❌ If Flask icons = 0 → Render condition is failing');
