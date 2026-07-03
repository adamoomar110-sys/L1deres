-- Tabla para el tracking en tiempo real del lavadero
CREATE TABLE IF NOT EXISTS public.lavadero_camera_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id INT, -- ID numérico generado por la cámara/OpenCV
    nickname TEXT NOT NULL, -- Nombre fantasía (ej: "Rayo Veloz")
    zone TEXT NOT NULL CHECK (zone IN ('espera', 'lavado', 'terminado')),
    color TEXT NOT NULL, -- Color del auto en el frontend (ej: "#06b6d4")
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.lavadero_camera_queue ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir lectura pública de la cola" ON public.lavadero_camera_queue
    FOR SELECT USING (true);

CREATE POLICY "Permitir gestión completa a administradores/service_role" ON public.lavadero_camera_queue
    FOR ALL USING (true) WITH CHECK (true);
