import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driver_id = searchParams.get('driver_id');
    
    if (!driver_id) {
      return NextResponse.json({ error: 'driver_id requerido' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('driver_logs')
      .select('*')
      .eq('driver_id', driver_id)
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
    const { driver_id, type, description } = body;

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('driver_logs')
      .insert([{ driver_id, type, description }]);

    if (error) throw error;
    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
