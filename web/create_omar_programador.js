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
  console.log('Creando usuario omar@programador.com...');
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'omar@programador.com',
    password: 'abcabc',
    email_confirm: true,
    user_metadata: { full_name: 'Omar Programador' }
  });
  
  if (createError) {
    console.error('Error al crear en auth.users:', createError);
    // Intentamos actualizar la contraseña si el usuario ya existe
    if (createError.message.includes('already exists')) {
        console.log('El usuario ya existe, actualizando su contraseña...');
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existingUser = usersData.users.find(u => u.email === 'omar@programador.com');
        if (existingUser) {
             await supabase.auth.admin.updateUserById(existingUser.id, { password: 'abcabc' });
             console.log('Contraseña actualizada a abcabc.');
             // upsert perfil igual
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: existingUser.id,
                  email: 'omar@programador.com',
                  full_name: 'Omar Programador',
                  role: 'admin'
                });
             if(!profileError) { console.log('Perfil garantizado como admin.'); }
             return;
        }
    }
    return;
  }
  
  const user = newUser.user;
  console.log('Usuario auth.users creado, ID:', user.id);

  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: 'omar@programador.com',
      full_name: 'Omar Programador',
      role: 'admin' // le damos admin porque es programador y necesita acceso a todo
    });

  if (profileError) {
    console.error('Error al crear el perfil en la tabla profiles:', profileError);
  } else {
    console.log('\n--- ÉXITO ---');
    console.log('El usuario programador ha sido creado con éxito.');
    console.log('Email: omar@programador.com');
    console.log('Contraseña: abcabc');
  }
}

createAdmin();
