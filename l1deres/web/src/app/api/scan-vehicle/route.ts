import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en Vercel.' }, { status: 500 });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = "Eres un experto en autos argentinos. Extrae de esta imagen la siguiente información y devuelve ÚNICAMENTE un objeto JSON, sin nada de texto extra. Si no ves algo, pon null. Ejemplo de respuesta esperada: {\"plate\":\"AA123BB\",\"brand\":\"Fiat\",\"model\":\"Cronos\",\"color\":\"Rojo\"}";

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: image } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Gemini Error:", err);
            return NextResponse.json({ error: 'Fallo al procesar imagen en IA' }, { status: 500 });
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        
        let result = {};
        try {
            const match = textResponse.match(/\{[\s\S]*\}/);
            if (match) {
                result = JSON.parse(match[0]);
            }
        } catch (e) {
            console.error("Error parseando respuesta de Gemini:", e);
        }

        return NextResponse.json(result);
        
    } catch (error: any) {
        console.error("Error en scan-vehicle API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
