-- ====================================================================
-- CREACIÓN DE TABLAS FALTANTES PARA EL LAVADERO L1DERES
-- ====================================================================
-- Ejecutá todo este código en el SQL Editor de tu Dashboard de Supabase.
-- Esto solucionará el error "Operando en modo local" al cargar el panel.

-- 1. Insumos (Stock de productos)
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

-- 2. Gastos (Finanzas)
CREATE TABLE IF NOT EXISTS public.lavadero_gastos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    detalle TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    estado TEXT DEFAULT 'pagado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sueldos (Finanzas)
CREATE TABLE IF NOT EXISTS public.lavadero_sueldos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    empleado_nombre TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- 5. Historial de Servicios
CREATE TABLE IF NOT EXISTS public.lavadero_historial_servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID,
    patente TEXT,
    servicio TEXT,
    monto NUMERIC,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Precios y Configuraciones
CREATE TABLE IF NOT EXISTS public.lavadero_precios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria TEXT,
    nombre TEXT,
    precio NUMERIC,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HABILITAR SEGURIDAD (RLS) PARA TODAS LAS TABLAS
-- ==========================================

ALTER TABLE public.lavadero_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_sueldos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_historial_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavadero_precios ENABLE ROW LEVEL SECURITY;

-- Crear políticas de lectura/escritura pública (ideal para PWA Kiosco y Panel sin login estricto)
-- Si luego integrás Auth de Supabase, podés cambiar "true" por autenticación estricta.

CREATE POLICY "Permitir todo Insumos" ON public.lavadero_insumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Gastos" ON public.lavadero_gastos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Sueldos" ON public.lavadero_sueldos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Clientes" ON public.lavadero_clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Historial" ON public.lavadero_historial_servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo Precios" ON public.lavadero_precios FOR ALL USING (true) WITH CHECK (true);
