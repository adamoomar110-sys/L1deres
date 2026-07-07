const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { 
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ''); 
  }
});

async function run() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.SUPABASE_SERVICE_ROLE_KEY}`);
    const data = await res.json();
    console.log('--- TABLES IN SCHEMA ---');
    const tables = Object.keys(data.definitions || {});
    console.log(tables.join('\n'));
    
    console.log('\n--- SERVICE ORDERS DEFINITION ---');
    if (data.definitions && data.definitions.service_orders) {
      console.log(JSON.stringify(data.definitions.service_orders.properties, null, 2));
    } else {
      console.log('service_orders table not found in OpenAPI definitions.');
    }

    console.log('\n--- VEHICLES DEFINITION ---');
    if (data.definitions && data.definitions.vehicles) {
      console.log(JSON.stringify(data.definitions.vehicles.properties, null, 2));
    } else {
      console.log('vehicles table not found in OpenAPI definitions.');
    }
  } catch (err) {
    console.error(err);
  }
}

run();
