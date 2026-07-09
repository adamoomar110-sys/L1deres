-- ====================================================================
-- CREACIÓN DE TABLAS NÚCLEO FALTANTES PARA EL LAVADERO
-- ====================================================================
-- El error de "Modo Local" persiste porque faltan las tablas base que 
-- el sistema usa para el historial de lavados y la cola de cámara.
-- Ejecutá todo este código en el SQL Editor de Supabase:

-- 1. Tabla base de Órdenes de Servicio (Usada para el Historial)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID,
    provider_type TEXT,
    status TEXT DEFAULT 'pending',
    description TEXT,
    budget NUMERIC,
    appointment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cola de Cámara (Tracking en tiempo real)
CREATE TABLE IF NOT EXISTS public.lavadero_camera_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id INT,
    nickname TEXT NOT NULL,
    zone TEXT NOT NULL,
    color TEXT NOT NULL,
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insumos (Stock de productos)
CREATE TABLE IF NOT EXISTS public.lavadero_insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    unit TEXT,
    price NUMERIC DEFAULT 0,
    minStock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clientes (CRM y Promociones)
CREATE TABLE IF NOT EXISTS public.lavadero_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patente TEXT UNIQUE NOT NULL,
    telefono TEXT,
    nombre TEXT,
    visitas INTEGER DEFAULT 1,
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HABILITAR SEGURIDAD (RLS) PARA TODAS LAS TABLAS
-- ==========================================

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_camera_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_clientes ENABLE ROW LEVEL SECURITY;

-- Crear políticas de lectura/escritura pública
CREATE POLICY "Permitir todo Service Orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Camera Queue" ON public.lavadero_camera_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Insumos" ON public.lavadero_insumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Clientes" ON public.lavadero_clientes FOR ALL USING (true) WITH CHECK (true);
