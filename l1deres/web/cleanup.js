const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ''); }
});
const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth: { autoRefreshToken: false, persistSession: false }});
async function run() {
  let hasMore = true;
  let page = 1;
  while(hasMore) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 50 });
    if (error || !users || users.length === 0) break;
    for (const u of users) {
      if (u.email === 'encargado_vip@lavadero.com' || u.email === 'lavador_vip@lavadero.com') {
        console.log('Deleting', u.email, u.id);
        await supabaseAdmin.auth.admin.deleteUser(u.id);
        await supabaseAdmin.from('profiles').delete().eq('id', u.id);
      }
    }
    page++;
  }
}
run();
