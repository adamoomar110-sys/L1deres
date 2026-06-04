-- Drop the table if it exists
DROP TABLE IF EXISTS public.applicants;

-- Create applicants table
CREATE TABLE public.applicants (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  dni text not null,
  phone text,
  age integer,
  zone text,
  app_experience text,
  accident_history text,
  has_professional_license boolean default false,
  can_pay_advance boolean default false,
  dni_front_url text,
  dni_back_url text,
  license_url text,
  selfie_url text,
  status text default 'pending', -- pending, approved, hired, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since it's a public form)
CREATE POLICY "Enable insert for anyone" ON public.applicants
  FOR INSERT WITH CHECK (true);

-- Allow admins to read all
CREATE POLICY "Enable read for admins" ON public.applicants
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to update
CREATE POLICY "Enable update for admins" ON public.applicants
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
