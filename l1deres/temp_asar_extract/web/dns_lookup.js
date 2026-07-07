const dns = require('dns');

dns.resolve4('db.nciyjiflrcflhsdsjnlt.supabase.co', (err, addresses) => {
  if (err) console.error('IPv4 resolution failed:', err);
  else console.log('IPv4 addresses:', addresses);
});

dns.resolve6('db.nciyjiflrcflhsdsjnlt.supabase.co', (err, addresses) => {
  if (err) console.error('IPv6 resolution failed:', err);
  else console.log('IPv6 addresses:', addresses);
});
