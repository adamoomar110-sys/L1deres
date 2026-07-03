const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://actxvqczpnbstlatrvto.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdHh2cWN6cG5ic3RsYXRydnRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUzNTY1MiwiZXhwIjoyMDk2MTExNjUyfQ.LycHWO6tUyxM-OGPS23VfyMJmpzjF_QT1T2OmiArP9A';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createNewAdmin() {
  const email = 'omar@programador.com';
  const password = '123456'; // asumiendo que puso una contraseña simple de 6 caracteres

  console.log(`Creando usuario ${email}...`);
  
  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: 'Omar Programador' }
  });

  let userId;

  if (authError) {
    console.error('Error creando usuario auth:', authError.message);
    if (authError.message.includes('already been registered')) {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        const omar = users.users.find(u => u.email === email);
        if (omar) {
            userId = omar.id;
            // update password just in case
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: password });
        }
    } else {
        return;
    }
  } else {
      userId = authData.user.id;
  }

  console.log('Usuario auth listo! ID:', userId);

  // 2. Crear/actualizar perfil como admin
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Omar Programador',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error creando perfil:', profileError.message);
  } else {
    console.log('Perfil admin creado/actualizado exitosamente!');
  }
}

createNewAdmin();
