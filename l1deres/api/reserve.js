// API endpoint to create a reservation (online or cash)
// Expected POST body: { license_plate: string, payment_method: 'online'|'cash' }
// Returns: { id, position }
import { supabase } from '../../supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { license_plate, payment_method } = req.body;
  if (!license_plate || !payment_method) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // Insert reservation
  const { data, error } = await supabase.from('lavadero_camera_queue').insert({
    license_plate,
    status: payment_method === 'online' ? 'reserved' : 'pending_cash',
    payment_method,
    created_at: new Date().toISOString()
  }).single();
  if (error) return res.status(500).json({ error: error.message });
  // Get position (count of earlier entries with same statuses)
  const { count } = await supabase
    .from('lavadero_camera_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', data.status)
    .lt('created_at', data.created_at);
  const position = count + 1;
  res.status(200).json({ id: data.id, position });
}
