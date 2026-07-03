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
    const paths = Object.keys(data.paths || {});
    console.log('Available paths/functions:');
    paths.filter(p => p.startsWith('/rpc/')).forEach(p => console.log(p));
  } catch (err) {
    console.error(err);
  }
}

run();
