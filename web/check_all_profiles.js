const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if(m) env[m[1].trim()]=m[2].trim().replace(/^['"]|['"]$/g, '');
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('profiles').select('*').then(({data, error}) => {
  if(error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
});
