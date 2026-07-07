import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const whatsappToken = process.env.WHATSAPP_TOKEN;
const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;

async function sendWhatsAppAlert(vehicleId: string, alertType: string, details: string) {
  if (!whatsappToken || !whatsappPhoneId || whatsappToken === 'your_meta_token_here') {
    console.warn("⚠️ [WHATSAPP] Token no configurado. Saltando envío real.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: "TO_PHONE_NUMBER", // TODO: Reemplazar con el número de teléfono destino real
    type: "text",
    text: {
      body: `*${alertType}*\nVehículo: ${vehicleId}\nDetalles: ${details}`
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ [WHATSAPP] Mensaje enviado exitosamente para ${vehicleId}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ [WHATSAPP] Error enviando mensaje: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ [WHATSAPP] Excepción al enviar mensaje:`, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vehicle_id, speed, fuel_level, location } = body;

    if (!vehicle_id || speed === undefined || fuel_level === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[${vehicle_id}] Iniciando análisis de telemetría...`);

    // 1. Guardar en Supabase
    const { error: dbError } = await supabase
      .from('vehicle_telemetry')
      .insert({
        vehicle_id,
        speed,
        fuel_level,
        location,
        timestamp: new Date().toISOString()
      });

    if (dbError) {
      console.error(`[${vehicle_id}] ❌ Error guardando en Supabase:`, dbError);
    } else {
      console.log(`[${vehicle_id}] 💾 Telemetría guardada exitosamente en Supabase.`);
    }

    // 2. Evaluamos reglas y enviamos alertas secuencialmente (rápido)
    if (speed > 120) {
      const alertMsg = `Exceso de velocidad detectado (${speed} km/h)`;
      console.log(`[${vehicle_id}] ⚠️ ALERTA: ${alertMsg}`);
      await sendWhatsAppAlert(vehicle_id, "ALERTA DE SEGURIDAD", alertMsg);
    }

    if (fuel_level < 15.0) {
      const alertMsg = `Nivel de combustible crítico (${fuel_level}%)`;
      console.log(`[${vehicle_id}] ⚠️ ALERTA: ${alertMsg}`);
      await sendWhatsAppAlert(vehicle_id, "ALERTA MANTENIMIENTO", alertMsg);
    }

    return NextResponse.json({ 
      status: "accepted", 
      message: "Telemetry processed successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing telemetry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
