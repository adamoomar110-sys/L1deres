import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, cargo, funcion, turno, legajo } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Must add this to .env.local

    if (!serviceRoleKey) {
      // Fallback for demo/testing purposes ONLY if service role isn't set, though it will fail
      return NextResponse.json({ error: 'Service Role Key no configurada en el servidor' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Crear el usuario en Auth usando la API de Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, cargo, funcion, turno, legajo }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insertar en perfiles (solo lo basico soportado por schema original)
    const userId = authData.user.id;
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email,
      full_name,
      role: role || 'driver'
    });

    if (profileError) {
       // Rollback if profile creation fails
       await supabaseAdmin.auth.admin.deleteUser(userId);
       return NextResponse.json({ error: 'Error creando el perfil: ' + profileError.message }, { status: 400 });
    }

    // 3. Simular envío de Email si la flag está activa
    if (body.send_email) {
      console.log(`📧 ENVIANDO EMAIL DE BIENVENIDA A: ${email}`); // TODO: Enviar email real (Integrar SendGrid o Resend)
      console.log(`Cuerpo: Hola ${full_name}, bienvenido al Lavadero VIP. Tus credenciales son: User: ${email} / Pass: ${password}`);
      // En producción aquí se llamaría a Resend, SendGrid, o Nodemailer.
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      email_sent: !!body.send_email 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
