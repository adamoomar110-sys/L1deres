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

async function test() {
  // 1. Get first vehicle
  const { data: vehicles, error: getErr } = await supabase.from('vehicles').select('*').limit(1);
  if (getErr || !vehicles || vehicles.length === 0) {
    console.error('Error getting vehicles:', getErr);
    return;
  }
  const vehicle = vehicles[0];
  console.log(`Original status of vehicle ${vehicle.plate}: ${vehicle.status}`);

  // 2. Try to update status to 'lavadero'
  console.log(`Updating status to 'lavadero'...`);
  const { data: updated, error: updateErr } = await supabase
    .from('vehicles')
    .update({ status: 'lavadero' })
    .eq('id', vehicle.id)
    .select();

  if (updateErr) {
    console.error('❌ Failed to update status to lavadero:', updateErr);
  } else {
    console.log('✅ Updated status successfully:', updated);
    // Restore original status
    await supabase.from('vehicles').update({ status: vehicle.status }).eq('id', vehicle.id);
    console.log('Restored original status.');
  }
}

test();
