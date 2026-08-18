import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();


    let drivers = [];
    let applicants = [];
    let totalDebt = 0;
    let washPrice = 5000;
    let lavaderoCount = 0;

    // 1. Obtener choferes
    try {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('role', 'driver');
      drivers = data || [];
    } catch (e) { console.error('Error fetching drivers'); }

    // 2. Obtener postulantes
    try {
      const { data } = await supabaseAdmin.from('applicants').select('*').eq('status', 'pending');
      applicants = data || [];
    } catch (e) { console.error('Table applicants not found yet'); }

    // 3. Obtener pagos
    try {
      const { data: payments } = await supabaseAdmin.from('payments').select('amount, type').eq('status', 'pending');
      totalDebt = payments?.reduce((acc, curr) => curr.type === 'debt' ? acc + Number(curr.amount) : acc, 0) || 0;
    } catch (e) { console.error('Table payments not found yet'); }

    // 4. Obtener precio del lavado y unidades en lavadero
    try {
      const [wpRes, lavRes] = await Promise.all([
        supabaseAdmin.from('system_settings').select('value').eq('key', 'wash_price').single(),
        supabaseAdmin.from('vehicles').select('id').eq('status', 'lavadero')
      ]);
      if (wpRes.data?.value) washPrice = Number(wpRes.data.value);
      if (lavRes.data) lavaderoCount = lavRes.data.length;
    } catch (e) { console.error('Error fetching wash price or lavadero count'); }

    return NextResponse.json({
      summary: {
        totalDrivers: drivers.length,
        pendingApplicants: applicants.length,
        totalFleetDebt: totalDebt,
        washPrice,
        lavaderoCount
      },
      drivers,
      applicants
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
