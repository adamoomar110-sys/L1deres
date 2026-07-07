// Importamos el SDK de Mercado Pago
// Asegúrate de instalarlo con: npm install mercadopago
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Inicializamos el cliente de MP usando el Token configurado en las variables de entorno
        // PLACEHOLDER: Reemplazar con el token real en .env
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-PLACEHOLDER' });

        const preference = new Preference(client);

        // Creamos el cuerpo de la preferencia de pago
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: body.washId || 'LAVADO-1',
                        title: body.title || 'Servicio de Lavado',
                        quantity: 1,
                        unit_price: Number(body.price),
                        currency_id: 'ARS',
                    }
                ],
                // Información del pagador (opcional)
                payer: {
                    name: body.plate || 'Cliente',
                },
                // URLs a las que MP redirigirá después del pago
                back_urls: {
                    success: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/cliente.html?status=success` : 'http://localhost:3000/cliente.html?status=success',
                    failure: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/cliente.html?status=failure` : 'http://localhost:3000/cliente.html?status=failure',
                    pending: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/cliente.html?status=pending` : 'http://localhost:3000/cliente.html?status=pending'
                },
                auto_return: 'approved',
                // URL que MP llamará silenciosamente para confirmar el pago (Webhook)
                notification_url: process.env.MP_WEBHOOK_URL || 'https://tu-dominio.com/api/mercadopago/webhook'
            }
        });

        // Devolvemos el ID de la preferencia para que el Frontend inicie el checkout
        return NextResponse.json({ id: result.id, init_point: result.init_point });
    } catch (error) {
        console.error('Error creando preferencia MP:', error);
        return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
    }
}
