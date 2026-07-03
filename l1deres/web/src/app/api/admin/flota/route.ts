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

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const [vehiclesRes, profilesRes] = await Promise.all([
      supabaseAdmin.from('vehicles').select('*').order('plate'),
      supabaseAdmin.from('profiles').select('*').order('full_name')
    ]);

    if (vehiclesRes.error) throw vehiclesRes.error;
    if (profilesRes.error) throw profilesRes.error;

    return NextResponse.json({
      vehicles: vehiclesRes.data || [],
      drivers: profilesRes.data || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id, status, brand, model } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;

    const { error } = await supabaseAdmin
      .from('vehicles')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
