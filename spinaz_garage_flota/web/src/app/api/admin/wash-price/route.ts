import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'wash_price')
      .single();

    const price = data?.value || '5000';
    return NextResponse.json({ price: Number(price) });
  } catch (error: any) {
    return NextResponse.json({ price: 5000 });
  }
}

export async function POST(req: Request) {
  try {
    const { price } = await req.json();
    if (!price || isNaN(Number(price))) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({ key: 'wash_price', value: String(price) }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true, price: Number(price) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
