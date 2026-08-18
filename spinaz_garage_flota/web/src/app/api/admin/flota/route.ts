import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const [profilesRes, vehiclesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('role', 'driver'),
      supabaseAdmin.from('vehicles').select('*')
    ]);

    if (profilesRes.error) throw new Error('Error perfiles: ' + profilesRes.error.message);
    if (vehiclesRes.error) throw new Error('Error vehículos: ' + vehiclesRes.error.message);

    return NextResponse.json({
      drivers: profilesRes.data,
      vehicles: vehiclesRes.data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .insert([body]);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, appointment_date, budget, description } = body;
    if (!id || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    let vehicle;
    const { data: vData, error: vError } = await supabaseAdmin
      .from('vehicles')
      .update({ status })
      .eq('id', id);

    if (vError) throw vError;
    vehicle = vData;

    if (status === 'maintenance' || status === 'lubricentro' || status === 'lavadero') {
      const cleanDate = appointment_date && appointment_date.trim() !== '' ? appointment_date : null;
      const cleanBudget = budget && budget.toString().trim() !== '' ? parseFloat(budget.toString()) : null;

      let providerType = 'taller';
      let placeName = 'el taller';
      let emoji = '⚠️';

      if (status === 'lubricentro') {
        providerType = 'lubricentro';
        placeName = 'el lubricentro';
        emoji = '🛢️';
      } else if (status === 'lavadero') {
        providerType = 'lavadero';
        placeName = 'el lavadero';
        emoji = '🧽';
      }

      await supabaseAdmin.from('service_orders').insert([{
        vehicle_id: id,
        provider_type: providerType,
        appointment_date: cleanDate,
        budget: cleanBudget,
        description: description || `Envío automático a ${placeName}`,
        status: 'pending'
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
