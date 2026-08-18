import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('benefits')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ benefits: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener beneficios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, location, icon, color } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('benefits')
      .insert([{ title, description, location, icon, color }]);

    if (error) throw error;

    return NextResponse.json({ success: true, benefit: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear beneficio' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, is_active } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('benefits')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
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
      .from('benefits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
