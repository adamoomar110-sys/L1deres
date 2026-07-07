const dns = require('dns');

const poolers = [
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com'
];

poolers.forEach(host => {
  dns.resolve4(host, (err, addresses) => {
    if (!err) {
      console.log(`✅ IPv4 for ${host}:`, addresses);
    }
  });
});
