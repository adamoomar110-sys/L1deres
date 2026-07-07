-- Solución para el error de políticas RLS (Row Level Security)
-- Copia y pega este código en el SQL Editor de tu Dashboard de Supabase y ejecútalo.

-- 1. Habilitar RLS en todas las tablas (por si acaso)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas (para evitar conflictos)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can insert applicants" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view applicants" ON public.applicants;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Drivers can insert/view own reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Los administradores pueden gestionar vehículos" ON public.vehicles;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver vehículos" ON public.vehicles;

-- 3. Definir nuevas políticas completas

-- VEHÍCULOS (Soluciona el error de "new row violates row-level security policy")
CREATE POLICY "Admins can manage vehicles" ON public.vehicles 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles 
FOR SELECT USING (auth.role() = 'authenticated');

-- PERFILES
CREATE POLICY "Admins can manage all profiles" ON public.profiles 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (id = auth.uid());

-- POSTULANTES
CREATE POLICY "Public can insert applicants" ON public.applicants 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage applicants" ON public.applicants 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PAGOS
CREATE POLICY "Admins can manage payments" ON public.payments 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can view own payments" ON public.payments 
FOR SELECT USING (driver_id = auth.uid());

-- INCIDENCIAS
CREATE POLICY "Admins can manage incidents" ON public.incidents 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can manage own incidents" ON public.incidents 
FOR ALL USING (driver_id = auth.uid());

-- ANUNCIOS
CREATE POLICY "Admins can manage announcements" ON public.announcements 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view active announcements" ON public.announcements 
FOR SELECT USING (is_active = true);

-- REPORTES DIARIOS
CREATE POLICY "Admins can manage all daily reports" ON public.daily_reports 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can manage own daily reports" ON public.daily_reports 
FOR ALL USING (driver_id = auth.uid());
