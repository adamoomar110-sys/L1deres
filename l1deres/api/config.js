module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    queueTable: process.env.SUPABASE_QUEUE_TABLE || 'lavadero_camera_queue',
    serviceTable: process.env.SUPABASE_SERVICE_TABLE || 'service_orders'
  });
};
