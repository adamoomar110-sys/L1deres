import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const driverId = formData.get('driver_id') as string;
    const amountStr = formData.get('amount') as string;

    if (!file || !driverId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}_${Date.now()}.${fileExt}`;

    // 1. Subir a Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('payment-receipts')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('payment-receipts')
      .getPublicUrl(fileName);

    // 3. Insertar registro en payments
    const { error: dbError } = await supabaseAdmin.from('payments').insert([{
      driver_id: driverId,
      amount: Number(amountStr) || 0,
      type: 'payment',
      status: 'pending',
      receipt_url: publicUrl,
      notes: `Pago informado por el chofer via portal.`
    }]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Error al procesar pago:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
