import { supabase } from './supabase';

export interface SystemSettings {
  brand_name: string;
  brand_logo: string;
  primary_color: string;
  contact_email: string;
  currency_symbol: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  // Desconectado temporalmente de la DB para forzar la marca del Lavadero VIP
  // hasta que tengan su propia base de datos independiente.
  return {
    brand_name: 'Lavadero VIP',
    brand_logo: '',
    primary_color: '#06B6D4',
    contact_email: 'contacto@lavaderovip.com',
    currency_symbol: '$',
  };
}
