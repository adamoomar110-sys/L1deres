import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').insert({
      email,
      password,
      full_name,
      role: role || 'driver'
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (body.send_email) {
      console.log(`📧 ENVIANDO EMAIL DE BIENVENIDA A: ${email}`);
      console.log(`Cuerpo: Hola ${full_name}, bienvenido a Spinaz Garage. Tus credenciales son: User: ${email} / Pass: ${password}`);
    }

    return NextResponse.json({ 
      success: true, 
      user: profileData,
      email_sent: !!body.send_email 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
