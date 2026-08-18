export interface SystemSettings {
  brand_name: string;
  brand_logo: string;
  primary_color: string;
  contact_email: string;
  currency_symbol: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  brand_name: 'Spinaz Garage',
  brand_logo: '',
  primary_color: '#EAB308',
  contact_email: 'soporte@spinaz.com',
  currency_symbol: '$',
};

export async function getSystemSettings(): Promise<SystemSettings> {
  return DEFAULT_SETTINGS;
}

