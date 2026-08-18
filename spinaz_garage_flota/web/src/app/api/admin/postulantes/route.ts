import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/donweb-api';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, applicants: data || [] });
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
      .from('applicants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Postulante eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('applicants')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'hire';

    if (action === 'hire') {
      const res = await fetch(`${API_BASE_URL}/applicants.php?action=hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return NextResponse.json({ error: data.error || 'Error al contratar chofer' }, { status: 400 });
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

