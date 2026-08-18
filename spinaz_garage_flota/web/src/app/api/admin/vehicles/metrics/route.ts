import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, metrics } = body;

    if (!id || !metrics) {
      return NextResponse.json({ error: 'ID y métricas son requeridos' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .update({ metrics })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, vehicle: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
