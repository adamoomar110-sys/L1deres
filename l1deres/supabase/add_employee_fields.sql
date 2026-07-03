-- Ejecuta este script en el editor SQL de Supabase para habilitar las nuevas columnas de legajos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funcion TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS turno TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legajo TEXT;
