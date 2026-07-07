-- Actualización de la restricción de estado del vehículo para incluir 'lavadero'
-- Copia y pega este código en el SQL Editor de tu Dashboard de Supabase y ejecútalo.

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('active', 'maintenance', 'lubricentro', 'lavadero', 'out_of_service'));
