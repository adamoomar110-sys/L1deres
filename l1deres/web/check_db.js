const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { 
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ''); 
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('--- COMPROBACIÓN DE TABLAS SUPABASE ---');
  
  // 1. Verificar table 'lavadero_camera_queue'
  console.log('\n1. Verificando tabla lavadero_camera_queue...');
  const { data: queueData, error: queueErr } = await supabase
    .from('lavadero_camera_queue')
    .select('*')
    .limit(1);
    
  if (queueErr) {
    console.error('❌ Error en lavadero_camera_queue:', queueErr);
  } else {
    console.log('✅ Tabla lavadero_camera_queue existe. Datos:', queueData);
  }

  // 2. Verificar si podemos actualizar estado a 'lavadero'
  console.log('\n2. Verificando restricción de estado del vehículo...');
  const { data: vehicles } = await supabase.from('vehicles').select('*').limit(1);
  if (vehicles && vehicles.length > 0) {
    const v = vehicles[0];
    console.log(`Intentando actualizar vehículo ${v.plate} a estado 'lavadero'...`);
    const { data: updated, error: updateErr } = await supabase
      .from('vehicles')
      .update({ status: 'lavadero' })
      .eq('id', v.id)
      .select();
      
    if (updateErr) {
      console.error('❌ No se pudo actualizar a "lavadero". Error:', updateErr.message);
    } else {
      console.log('✅ Se actualizó con éxito a "lavadero". Restaurando estado original...');
      await supabase.from('vehicles').update({ status: v.status }).eq('id', v.id);
      console.log('✅ Estado original restaurado.');
    }
  } else {
    console.log('⚠️ No hay vehículos registrados para probar.');
  }
}

check();
