const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
const envContent = fs.readFileSync('.env.local', 'utf-8');
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if(m) env[m[1].trim()]=m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  console.log('Verificando usuario admin@lavadero.com...');
  
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
     console.error('Error listing users', listError);
     return;
  }
  
  let user = listData.users.find(u => u.email === 'admin@lavadero.com');
  
  if (user) {
    console.log('Usuario existe, actualizando contraseña...');
    await supabase.auth.admin.updateUserById(user.id, { password: 'lavaderovip2026' });
  } else {
    console.log('Creando usuario...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@lavadero.com',
      password: 'lavaderovip2026',
      email_confirm: true,
      user_metadata: { full_name: 'Omar Admin' }
    });
    if (createError) {
      console.error('Error al crear:', createError);
      return;
    }
    user = newUser.user;
  }

  // Ensure profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: 'admin@lavadero.com',
      full_name: 'Omar Admin',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error en profile:', profileError);
  } else {
    console.log('¡Listo! Email: admin@lavadero.com | Pass: lavaderovip2026');
  }
}

createAdmin();
