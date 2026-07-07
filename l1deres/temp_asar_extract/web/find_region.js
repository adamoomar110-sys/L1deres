const { Client } = require('pg');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1'
];

async function findRegion() {
  const database = 'postgres';
  const user = 'postgres.nciyjiflrcflhsdsjnlt';
  const password = 'dummy_password_test_123';
  const port = 6543;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Checking region ${region} (${host})...`);
    
    const client = new Client({
      host,
      database,
      user,
      password,
      port,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`✅ CONNECTED? This shouldn't happen with dummy password!`);
      await client.end();
      return;
    } catch (err) {
      if (err.message.includes('password authentication failed') || err.message.includes('incorrect password')) {
        console.log(`🎯 FOUND REGION! The region is: ${region}`);
        console.log(`Error message was: ${err.message}`);
        return;
      } else {
        console.log(`❌ Region ${region} failed: ${err.message}`);
      }
    }
  }
  console.log('Finished checking all regions.');
}

findRegion();
