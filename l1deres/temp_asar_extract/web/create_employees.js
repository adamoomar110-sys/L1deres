const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { 
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ''); 
  }
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('🚀 Creando Empleados en Supabase...');

  const employees = [
    {
      email: 'encargado2026@lavadero.com',
      password: 'LavaderoVIP2026',
      full_name: 'Carlos Encargado',
      role: 'admin',
      cargo: 'Encargado',
      funcion: 'Supervisión y Caja',
      turno: 'Turno Completo (09-18)',
      legajo: 'ENC-001'
    },
    {
      email: 'lavador2026@lavadero.com',
      password: 'LavaderoVIP2026',
      full_name: 'Juan Lavador',
      role: 'washer',
      cargo: 'Detailer / Washer',
      funcion: 'Lavado Exterior e Interior',
      turno: 'Turno Mañana (08-16)',
      legajo: 'LAV-001'
    }
  ];

  for (const emp of employees) {
    console.log(`\n👨‍💼 Creando ${emp.cargo}: ${emp.email}...`);
    
    // Buscar y eliminar si existe
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users.find(u => u.email === emp.email);
    if (existingUser) {
        console.log(`Borrando usuario existente ${emp.email}...`);
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // 1. Crear usuario auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emp.email,
      password: emp.password,
      email_confirm: true,
      user_metadata: { full_name: emp.full_name, role: emp.role, cargo: emp.cargo, funcion: emp.funcion, turno: emp.turno, legajo: emp.legajo }
    });

    if (authError) {
      console.error(`❌ Error en Auth:`, authError.message);
      continue;
    }

    // Encontrar ID (ya sea nuevo o existente)
    let userId = authData?.user?.id;
    if (!userId) {
       const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('email', emp.email).single();
       if (existing) userId = existing.id;
    }

    if (userId) {
      // 2. Insertar perfil basico
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: emp.email,
        full_name: emp.full_name,
        role: emp.role === 'admin' ? 'admin' : 'driver'
      });

      if (profileError) {
        console.error(`❌ Error en Perfil:`, profileError.message);
      } else {
        console.log(`✅ Empleado ${emp.full_name} guardado en la base de datos.`);
      }
    }
  }

  console.log('\n🎉 PROCESO COMPLETADO.');
}

run();
