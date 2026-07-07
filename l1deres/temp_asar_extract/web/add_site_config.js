const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { 
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ''); 
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function addConfig() {
  console.log('Inserting site_config for lavadero...');
  
  // Check if it already exists
  const { data: existing, error: getErr } = await supabase
    .from('site_config')
    .select('*')
    .eq('module_name', 'lavadero');
    
  if (getErr) {
    console.error('Error checking site_config:', getErr);
    return;
  }
  
  if (existing && existing.length > 0) {
    console.log('✅ site_config for lavadero already exists:', existing[0]);
    return;
  }

  const { data, error } = await supabase
    .from('site_config')
    .insert([{ module_name: 'lavadero', is_enabled: true }])
    .select();

  if (error) {
    console.error('❌ Failed to insert site_config:', error);
  } else {
    console.log('✅ site_config inserted successfully:', data);
  }
}

addConfig();
