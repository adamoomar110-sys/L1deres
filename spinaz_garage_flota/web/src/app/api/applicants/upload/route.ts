import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const dni = formData.get('dni') as string;

    if (!file || !folder || !dni) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${dni}_${folder}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabaseAdmin.storage
      .from('applicants-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('applicants-documents')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
