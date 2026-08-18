// ============================================================
// DONWEB API ADAPTER - REPLACING SUPABASE CLIENT FOR SPINAZ GARAGE
// ============================================================
import { donwebClientAdapter } from './donweb-api';

// Cliente DonWeb nativo expuesto como 'supabase' para compatibilidad transparente
export const supabase = donwebClientAdapter as any;

export function createAdminClient() {
  return donwebClientAdapter as any;
}
