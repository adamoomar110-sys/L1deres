import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Verificar Token de Seguridad (para evitar llamadas externas no autorizadas)
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obtener todos los choferes activos
    const { data: drivers, error: driverError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'driver');

    if (driverError) throw driverError;

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({ message: 'No active drivers found' });
    }

    // 3. Generar deudas de $350,000
    const weeklyDebt = 350000;
    const debtRecords = drivers.map(driver => ({
      driver_id: driver.id,
      amount: weeklyDebt,
      type: 'debt',
      status: 'pending',
      notes: 'Generación automática semanal (Miércoles)',
      due_date: new Date().toISOString().split('T')[0]
    }));

    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert(debtRecords);

    if (insertError) throw insertError;

    return NextResponse.json({
      message: 'Deudas semanales generadas con éxito',
      count: drivers.length,
      amount_per_driver: weeklyDebt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
