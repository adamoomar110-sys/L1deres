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
  console.log('🏁 INICIANDO SIMULACIÓN DE MOVIMIENTOS EN SUPABASE...');
  
  // 1. Crear patente ficticia aleatoria
  const randomPlate = 'TEST' + Math.floor(Math.random() * 9000 + 1000);
  console.log(`\n🚗 1. Registrando vehículo ficticio: Patente ${randomPlate}...`);
  
  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .insert([{
      plate: randomPlate,
      name: 'Audi e-tron GT',
      brand: 'Audi',
      model: 'e-tron GT',
      status: 'active'
    }])
    .select('id')
    .single();

  if (vErr) {
    console.error('❌ Error al crear vehículo:', vErr.message);
    return;
  }
  const vehicleId = vehicle.id;
  console.log('✅ Vehículo registrado con ID:', vehicleId);

  // 2. Crear una orden de servicio pendiente con uno de los nuevos lavados
  console.log('\n📝 2. Creando Orden de Servicio: Tratamiento Cerámico 9H (Pendiente)...');
  const { data: order, error: oErr } = await supabase
    .from('service_orders')
    .insert([{
      vehicle_id: vehicleId,
      budget: 65000,
      description: '[LAVADERO] Tratamiento Cerámico 9H 💎 - Sellado acrílico de alta gama, descontaminado y brillo espejo.',
      status: 'pending',
      provider_type: 'lubricentro', // HACK
      appointment_date: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (oErr) {
    console.error('❌ Error al crear orden:', oErr.message);
    return;
  }
  const orderId = order.id;
  console.log('✅ Orden de Servicio registrada con ID:', orderId);

  // 3. Insertar auto en la cola de la cámara (Espera)
  console.log('\n📹 3. Insertando en Cola de Cámara (Zona: ESPERA)...');
  const { data: queueItem, error: qErr } = await supabase
    .from('announcements')
    .insert([{
      title: 'LAVADERO_CAMERA_QUEUE',
      content: JSON.stringify({
        tracking_id: Math.floor(Math.random() * 1000) + 1,
        nickname: 'Audi e-tron 💎',
        color: '#f97316', // Naranja
        zone: 'espera',
        entered_at: new Date().toISOString()
      }),
      is_active: true
    }])
    .select('id')
    .single();

  if (qErr) {
    console.error('❌ Error al insertar en cola de cámara:', qErr.message);
    return;
  }
  const queueId = queueItem.id;
  console.log('✅ Auto en cola registrado con ID:', queueId);

  // Esperar 2 segundos para simular avance
  await new Promise(r => setTimeout(r, 2000));

  // 4. Mover a lavado
  console.log('\n🧼 4. Simulando movimiento: Moviendo auto a zona "LAVADO"...');
  
  // Leemos el announcement actual para actualizar el content
  const { data: q1 } = await supabase.from('announcements').select('content').eq('id', queueId).single();
  let content1 = JSON.parse(q1.content);
  content1.zone = 'lavado';
  content1.entered_at = new Date().toISOString();

  const { error: moveErr1 } = await supabase
    .from('announcements')
    .update({ content: JSON.stringify(content1) })
    .eq('id', queueId);

  if (moveErr1) {
    console.error('❌ Error al mover a lavado:', moveErr1.message);
  } else {
    console.log('✅ Auto movido a zona "lavado".');
  }

  await new Promise(r => setTimeout(r, 2000));

  // 5. Mover a terminado
  console.log('\n✨ 5. Simulando movimiento: Moviendo auto a zona "TERMINADO" (Listo)...');
  
  const { data: q2 } = await supabase.from('announcements').select('content').eq('id', queueId).single();
  let content2 = JSON.parse(q2.content);
  content2.zone = 'terminado';
  content2.entered_at = new Date().toISOString();

  const { error: moveErr2 } = await supabase
    .from('announcements')
    .update({ content: JSON.stringify(content2) })
    .eq('id', queueId);

  if (moveErr2) {
    console.error('❌ Error al mover a terminado:', moveErr2.message);
  } else {
    console.log('✅ Auto movido a zona "terminado".');
  }

  await new Promise(r => setTimeout(r, 2000));

  // 6. Entregar / Cobrar la orden (Marcar como completada)
  console.log('\n💵 6. Cobrando el lavado: Marcando Orden de Servicio como COMPLETADA...');
  const { error: payErr } = await supabase
    .from('service_orders')
    .update({ status: 'completed' })
    .eq('id', orderId);

  if (payErr) {
    console.error('❌ Error al completar orden:', payErr.message);
  } else {
    console.log('✅ Orden de Servicio cobrada e ingresada a la facturación.');
  }

  // 7. Liberar el vehículo
  console.log('\n🔑 7. Liberando vehículo: Cambiando estado de flota a ACTIVE...');
  const { error: releaseErr } = await supabase
    .from('vehicles')
    .update({ status: 'active' })
    .eq('id', vehicleId);

  if (releaseErr) {
    console.error('❌ Error al liberar vehículo:', releaseErr.message);
  } else {
    console.log('✅ Vehículo liberado y activo.');
  }

  // 8. Quitar de la cola de visualización de cámara
  console.log('\n🧹 8. Limpiando visualizador: Removiendo auto de lavadero_camera_queue...');
  const { error: delErr } = await supabase
    .from('announcements')
    .delete()
    .eq('id', queueId);

  if (delErr) {
    console.error('❌ Error al quitar de la cola:', delErr.message);
  } else {
    console.log('✅ Auto removido de la cola pública.');
  }

  console.log('\n🎉 SIMULACIÓN COMPLETADA CON ÉXITO. TODO EN ORDEN EN SUPABASE.');
}

run();
