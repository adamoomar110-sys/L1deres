-- ====================================================================
-- MIGRACIÓN COMPLETA PARA EL MÓDULO DE LAVADERO DE AUTOS
-- ====================================================================
-- Copia y pega todo este código en el SQL Editor de tu Dashboard de Supabase y ejecútalo.
-- Esto creará la tabla de la cola de la cámara y actualizará las restricciones de estado de vehículos y tipo de proveedor de órdenes de servicio.

-- 1. Crear la tabla de la cola de la cámara para tracking en tiempo real
CREATE TABLE IF NOT EXISTS public.lavadero_camera_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id INT, -- ID numérico generado por la cámara/OpenCV
    nickname TEXT NOT NULL, -- Nombre fantasía (ej: "Rayo Veloz")
    zone TEXT NOT NULL CHECK (zone IN ('espera', 'lavado', 'terminado')),
    color TEXT NOT NULL, -- Color del auto en el frontend (ej: "#f97316")
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.lavadero_camera_queue ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores por si acaso
DROP POLICY IF EXISTS "Permitir lectura pública de la cola" ON public.lavadero_camera_queue;
DROP POLICY IF EXISTS "Permitir gestión completa a administradores/service_role" ON public.lavadero_camera_queue;

-- Crear políticas de RLS
CREATE POLICY "Permitir lectura pública de la cola" ON public.lavadero_camera_queue
    FOR SELECT USING (true);

CREATE POLICY "Permitir gestión completa a administradores/service_role" ON public.lavadero_camera_queue
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Actualizar la restricción de estado del vehículo para incluir 'lavadero'
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('active', 'maintenance', 'lubricentro', 'lavadero', 'out_of_service'));


-- 3. Actualizar la restricción del tipo de proveedor en órdenes de servicio para incluir 'lavadero'
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_provider_type_check;
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_provider_type_check CHECK (provider_type IN ('taller', 'lubricentro', 'lavadero'));
