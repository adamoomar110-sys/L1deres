import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    throw new Error('Service Role Key no configurada');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { plate, brand, model, color, nickname, washType, price, description } = body;

    if (!plate || !nickname || !washType) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (Patente, Apodo o Tipo de Lavado)' }, { status: 400 });
    }

    const cleanPlate = plate.trim().toUpperCase();

    // 1. Buscar o Crear Vehículo
    let vehicleId = '';
    const { data: existingVehicle, error: findError } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('plate', cleanPlate)
      .maybeSingle();

    if (findError) {
      throw new Error('Error al buscar vehículo: ' + findError.message);
    }

    if (existingVehicle) {
      vehicleId = existingVehicle.id;
      // Actualizar estado del vehículo a 'lavadero'
      const { error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({
        status: 'active',
          brand: brand || 'Desconocido',
          model: model || 'Desconocido'
        })
        .eq('id', vehicleId);

      if (updateError) {
        throw new Error('Error al actualizar estado del vehículo: ' + updateError.message);
      }
    } else {
      const vehicleName = `${brand || 'Desconocido'} ${model || 'Desconocido'}`.trim() || 'Vehículo';
      // Crear nuevo vehículo en estado 'lavadero'
      const { data: newVehicle, error: createError } = await supabaseAdmin
        .from('vehicles')
        .insert([{
          plate: cleanPlate,
          name: vehicleName,
          brand: brand || 'Desconocido',
          model: model || 'Desconocido',
          status: 'active'
        }])
        .select('id')
        .single();

      if (createError) {
        throw new Error('Error al registrar vehículo: ' + createError.message);
      }
      vehicleId = newVehicle.id;
    }

    // 2. Insertar Orden de Servicio
    const orderDescription = `Pedido Móvil: ${washType} (${description || ''}) - Apodo: ${nickname} - Color: ${color}`;
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('service_orders')
      .insert([{
        vehicle_id: vehicleId,
        budget: Number(price || 0),
        description: '[LAVADERO] ' + orderDescription, // Etiqueta para filtrado
        status: 'pending',
        provider_type: 'lavadero',
        appointment_date: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (orderError) {
      throw new Error('Error al crear orden de servicio: ' + orderError.message);
    }

    // 3. Insertar en la cola de la cámara (Usamos announcements como HACK temporal)
    const { data: newQueueItem, error: queueError } = await supabaseAdmin
      .from('announcements')
      .insert([{
        title: 'LAVADERO_CAMERA_QUEUE',
        content: JSON.stringify({
          tracking_id: Math.floor(Math.random() * 1000) + 1,
          nickname: nickname.trim(),
          color: color || '#06b6d4',
          zone: 'espera',
          entered_at: new Date().toISOString()
        }),
        is_active: true
      }])
      .select('id')
      .single();

    if (queueError) {
      // Hacemos rollback manual del service order para mantener la consistencia
      await supabaseAdmin.from('service_orders').delete().eq('id', newOrder.id);
      throw new Error('Error al ingresar auto al visualizador: ' + queueError.message);
    }

    return NextResponse.json({
      success: true,
      order_id: newOrder.id,
      queue_id: newQueueItem.id,
      plate: cleanPlate,
      nickname: nickname,
      color: color
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
