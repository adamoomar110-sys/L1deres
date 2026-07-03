const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://actxvqczpnbstlatrvto.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdHh2cWN6cG5ic3RsYXRydnRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUzNTY1MiwiZXhwIjoyMDk2MTExNjUyfQ.LycHWO6tUyxM-OGPS23VfyMJmpzjF_QT1T2OmiArP9A';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setAdmin() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const omar = users.users.find(u => u.email === 'adamoomar110@gmail.com');
  
  if (!omar) {
    console.log('User not found!');
    return;
  }
  
  console.log('Found user with ID:', omar.id);
  
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: omar.id,
      full_name: 'Omar Adamo',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('Perfil admin actualizado exitosamente!');
  }
}

setAdmin();
