const dns = require('dns');

dns.reverse('2600:1f18:2e13:9d15:6917:7fb0:561c:b5aa', (err, hostnames) => {
  if (err) console.error('Reverse lookup failed:', err);
  else console.log('Reverse hostnames:', hostnames);
});

dns.resolveTxt('db.nciyjiflrcflhsdsjnlt.supabase.co', (err, records) => {
  if (err) console.error('TXT lookup failed:', err);
  else console.log('TXT records:', records);
});

dns.resolveCname('db.nciyjiflrcflhsdsjnlt.supabase.co', (err, addresses) => {
  if (err) console.error('CNAME lookup failed:', err);
  else console.log('CNAME addresses:', addresses);
});
