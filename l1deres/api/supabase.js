import { createClient } from '@supabase/supabase-js';
import config from './config.js';

// Load supabase credentials from env via config endpoint (server side env)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
