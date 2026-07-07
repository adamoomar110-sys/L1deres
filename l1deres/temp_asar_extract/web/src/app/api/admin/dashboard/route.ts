import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();


    let drivers = [];
    let applicants = [];
    let totalDebt = 0;

    // 1. Obtener choferes (Seguro)
    try {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('role', 'driver');
      drivers = data || [];
    } catch (e) { console.error('Error fetching drivers'); }

    // 2. Obtener postulantes (Seguro - Esta es la que falla actualmente)
    try {
      const { data } = await supabaseAdmin.from('applicants').select('*').eq('status', 'pending');
      applicants = data || [];
    } catch (e) { console.error('Table applicants not found yet'); }

    // 3. Obtener pagos (Seguro)
    try {
      const { data: payments } = await supabaseAdmin.from('payments').select('amount, type').eq('status', 'pending');
      totalDebt = payments?.reduce((acc, curr) => curr.type === 'debt' ? acc + Number(curr.amount) : acc, 0) || 0;
    } catch (e) { console.error('Table payments not found yet'); }

    return NextResponse.json({
      summary: {
        totalDrivers: drivers.length,
        pendingApplicants: applicants.length,
        totalFleetDebt: totalDebt
      },
      drivers,
      applicants
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
