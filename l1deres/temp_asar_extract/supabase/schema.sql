-- Lavadero VIP Database Schema

-- 1. Profiles (Drivers and Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
    phone TEXT,
    dni TEXT,
    vehicle_id UUID, -- Assigned vehicle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plate TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'lubricentro', 'out_of_service')),
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to profiles for vehicle_id
ALTER TABLE public.profiles ADD CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- 3. Applicants (Postulantes)
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dni TEXT NOT NULL,
    age INTEGER,
    phone TEXT NOT NULL,
    zone TEXT,
    app_experience TEXT,
    accident_history TEXT,
    has_professional_license BOOLEAN DEFAULT false,
    can_pay_advance BOOLEAN DEFAULT false,
    dni_front_url TEXT,
    dni_back_url TEXT,
    license_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments & Debts (Pagos y Deudas)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT DEFAULT 'payment' CHECK (type IN ('payment', 'debt', 'penalty')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    due_date DATE, -- Wednesdays
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Incidents (Reporte de fallas)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    photo_url TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Announcements (Avisos de la empresa)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 7. Daily Reports (Control de KM y Horas)
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_km INTEGER NOT NULL,
    end_km INTEGER,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    revenue DECIMAL(10, 2) DEFAULT 0, -- Recaudación del turno
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- PROFILES
CREATE POLICY "Admins can manage all profiles" ON public.profiles 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (id = auth.uid());

-- VEHICLES
CREATE POLICY "Admins can manage vehicles" ON public.vehicles 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles 
FOR SELECT USING (auth.role() = 'authenticated');

-- APPLICANTS
CREATE POLICY "Public can insert applicants" ON public.applicants 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage applicants" ON public.applicants 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PAYMENTS
CREATE POLICY "Admins can manage payments" ON public.payments 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can view own payments" ON public.payments 
FOR SELECT USING (driver_id = auth.uid());

-- INCIDENTS
CREATE POLICY "Admins can manage incidents" ON public.incidents 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can manage own incidents" ON public.incidents 
FOR ALL USING (driver_id = auth.uid());

-- ANNOUNCEMENTS
CREATE POLICY "Admins can manage announcements" ON public.announcements 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view active announcements" ON public.announcements 
FOR SELECT USING (is_active = true);

-- DAILY REPORTS
CREATE POLICY "Admins can manage all daily reports" ON public.daily_reports 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Drivers can manage own daily reports" ON public.daily_reports 
FOR ALL USING (driver_id = auth.uid());

-- 9. Benefits (Lavadero VIP)
CREATE TABLE IF NOT EXISTS public.benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    icon TEXT, -- Lucide icon name
    color TEXT, -- Tailwind text color class
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for benefits
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (Continued)

-- BENEFITS
CREATE POLICY "Admins can manage benefits" ON public.benefits 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can view active benefits" ON public.benefits 
FOR SELECT USING (is_active = true);
