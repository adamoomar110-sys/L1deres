import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*');

    if (error) {
      return NextResponse.json({ exists: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ exists: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
