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
  console.log('Creando usuario omar@lavadero.com...');
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'omar@lavadero.com',
    password: 'lavaderovip2026',
    email_confirm: true,
    user_metadata: { full_name: 'Omar Admin' }
  });
  
  if (createError) {
    console.error('Error al crear en auth.users:', createError);
    return;
  }
  
  const user = newUser.user;
  console.log('Usuario auth.users creado, ID:', user.id);

  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: 'omar@lavadero.com',
      full_name: 'Omar Admin',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error al crear el perfil en la tabla profiles:', profileError);
  } else {
    console.log('\n--- ÉXITO ---');
    console.log('El administrador ha sido creado con éxito.');
    console.log('Email: omar@lavadero.com');
    console.log('Contraseña: lavaderovip2026');
  }
}

createAdmin();
