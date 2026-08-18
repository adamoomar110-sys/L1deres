import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, applicant_name, dni } = await req.json();

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_tu_llave_aqui') {
      console.warn('RESEND_API_KEY no configurada. Saltando envío de email.');
      return NextResponse.json({ message: 'API Key missing' }, { status: 200 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Spinaz Garage <noreply@spinazgarage.com>',
      to: [email],
      subject: 'Nueva Postulación Recibida - Spinaz Garage',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: white; padding: 40px; border-radius: 24px;">
          <h1 style="color: #EAB308; font-size: 24px; font-weight: 900; font-style: italic; margin-bottom: 20px;">SPINAZ GARAGE</h1>
          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">¡Hola, Admin!</h2>
          <p style="color: #A1A1AA; font-weight: 500; line-height: 1.6;">
            Se ha recibido una nueva postulación para la flota de conductores:
          </p>
          <div style="background-color: #18181B; padding: 20px; border-radius: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #EAB308; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Postulante</p>
            <p style="margin: 5px 0 15px 0; font-size: 18px; font-weight: 700;">${applicant_name}</p>
            
            <p style="margin: 0; color: #EAB308; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">DNI</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 700;">${dni}</p>
          </div>
          <p style="color: #71717A; font-size: 12px; font-weight: 700; text-align: center; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.1em;">
            Spinaz Garage © 2024 - Sistema de Gestión de Flota
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
