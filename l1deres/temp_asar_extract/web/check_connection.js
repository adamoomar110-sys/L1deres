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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🔌 VERIFICANDO CONEXIÓN DIRECTA CON SUPABASE...');
  
  const randomPlate = 'CONN' + Math.floor(Math.random() * 9000 + 1000);
  console.log(`\n🚗 1. Intentando insertar vehículo temporal con patente: ${randomPlate}...`);
  
  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .insert([{
      plate: randomPlate,
      name: 'Audi e-tron GT (Prueba Conexión)',
      brand: 'Audi',
      model: 'e-tron GT',
      status: 'active' // Estado permitido por la restricción actual
    }])
    .select('id')
    .single();

  if (vErr) {
    console.error('❌ Error al crear vehículo:', vErr.message);
    return;
  }
  const vehicleId = vehicle.id;
  console.log('✅ Vehículo registrado con ID:', vehicleId);

  console.log('\n📝 2. Intentando crear Orden de Servicio temporal con tipo "lubricentro"...');
  const { data: order, error: oErr } = await supabase
    .from('service_orders')
    .insert([{
      vehicle_id: vehicleId,
      budget: 15000,
      description: 'Prueba de conexión exitosa - Servicio de lubricación temporal',
      status: 'pending',
      provider_type: 'lubricentro', // Tipo permitido por la restricción actual
      appointment_date: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (oErr) {
    console.error('❌ Error al crear orden:', oErr.message);
  } else {
    console.log('✅ Orden de Servicio registrada con ID:', order.id);
    
    // Limpieza
    console.log('\n🧹 3. Limpiando registros temporales de prueba...');
    const { error: delOrderErr } = await supabase.from('service_orders').delete().eq('id', order.id);
    if (delOrderErr) console.error('⚠️ Error al limpiar orden:', delOrderErr.message);
    else console.log('✅ Orden temporal eliminada.');
  }

  const { error: delVehErr } = await supabase.from('vehicles').delete().eq('id', vehicleId);
  if (delVehErr) console.error('⚠️ Error al limpiar vehículo:', delVehErr.message);
  else console.log('✅ Vehículo temporal eliminado.');

  console.log('\n🎉 PRUEBA DE CONEXIÓN CON SUPABASE COMPLETADA. ¡CREDENCIALES Y CONECTIVIDAD 100% OPERATIVAS!');
}

run();
