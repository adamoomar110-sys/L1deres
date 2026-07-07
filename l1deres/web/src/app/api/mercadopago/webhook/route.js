import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Mercado Pago envía notificaciones a esta ruta cuando hay una actualización de pago
        // Generalmente, nos interesa el topic "payment"
        if (body.type === 'payment' || body.topic === 'payment') {
            const paymentId = body.data?.id;
            console.log(`[MP Webhook] Nuevo pago detectado. ID: ${paymentId}`);
            
            // TODO: Consultar la API de MP para verificar el estado de este pago
            // const paymentInfo = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            //     headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            // }).then(res => res.json());
            
            // if (paymentInfo.status === 'approved') {
            //     // 1. Obtener la referencia (ej: patente o washId) de paymentInfo.additional_info
            //     // 2. Actualizar Supabase lavadero_camera_queue -> isPaid = true
            // }
        }

        // Siempre debemos responder 200 OK a Mercado Pago rápidamente
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('Error procesando Webhook MP:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}
