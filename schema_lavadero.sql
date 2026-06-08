-- ============================================================
-- SCHEMA COMPLETO PARA LAVADERO DE LUJO
-- Ejecutar en el SQL Editor del nuevo proyecto Supabase
-- ============================================================

-- 1. TABLA DE PERFILES (usuarios del sistema)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'operador' CHECK (role IN ('admin', 'operador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA PRINCIPAL DE COLA DEL LAVADERO (cámara)
CREATE TABLE IF NOT EXISTS lavadero_camera_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id INTEGER,
  nickname TEXT NOT NULL,
  color TEXT DEFAULT '#06b6d4',
  zone TEXT DEFAULT 'espera' CHECK (zone IN ('espera', 'lavado', 'terminado', 'retorno')),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHÍCULOS (clientes del lavadero)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT UNIQUE NOT NULL,
  name TEXT,
  brand TEXT DEFAULT 'Desconocido',
  model TEXT DEFAULT 'Desconocido',
  color TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÓRDENES DE SERVICIO (historial de lavados)
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  description TEXT,
  budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  provider_type TEXT DEFAULT 'lavadero',
  appointment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AVISOS Y NOTIFICACIONES
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONFIGURACIÓN DEL SITIO (módulos habilitados)
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONFIGURACIÓN GENERAL
INSERT INTO site_config (module_name, is_enabled) VALUES
  ('lavadero', true),
  ('facturacion', true),
  ('usuarios', true),
  ('configuracion', true)
ON CONFLICT (module_name) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavadero_camera_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados tienen acceso completo
CREATE POLICY "Auth users full access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON lavadero_camera_queue FOR ALL USING (true);
CREATE POLICY "Auth users full access" ON vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON service_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON announcements FOR ALL USING (true);
CREATE POLICY "Auth users full access" ON site_config FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'operador');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. EMPLEADOS E INSUMOS (NUEVOS MÓDULOS)
-- ============================================================

-- Tabla de Empleados (Nómina y Jornadas)
CREATE TABLE IF NOT EXISTS lavadero_empleados (
  id BIGINT PRIMARY KEY, -- Usaremos Date.now() como ID simple por compatibilidad
  date TEXT,
  name TEXT NOT NULL,
  hours INTEGER DEFAULT 0,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Insumos (Inventario)
CREATE TABLE IF NOT EXISTS lavadero_insumos (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para nuevas tablas
ALTER TABLE lavadero_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavadero_insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access" ON lavadero_empleados FOR ALL USING (true);
CREATE POLICY "Auth users full access" ON lavadero_insumos FOR ALL USING (true);
