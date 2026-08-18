import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicle_id = searchParams.get('vehicle_id');
    
    if (!vehicle_id) {
      return NextResponse.json({ error: 'vehicle_id requerido' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('vehicle_logs')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ logs: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_id, type, description } = body;

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('vehicle_logs')
      .insert([{ vehicle_id, type, description }]);

    if (error) throw error;
    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
