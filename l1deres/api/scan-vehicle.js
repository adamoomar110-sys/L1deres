module.exports = async (req, res) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel.' });
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
            return res.status(500).json({ error: 'Fallo al procesar imagen en IA' });
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

        return res.status(200).json(result);
        
    } catch (error) {
        console.error("Error en scan-vehicle API:", error);
        return res.status(500).json({ error: error.message });
    }
};
