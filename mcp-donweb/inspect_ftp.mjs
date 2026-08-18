import * as ftp from "basic-ftp";

const CONFIG = {
  host: "a0170001.ferozo.com",
  user: "a0170001",
  password: "AuraFTP2025@aura",
  secure: true,
  secureOptions: { rejectUnauthorized: false },
};

async function inspect() {
  const client = new ftp.Client();
  try {
    await client.access(CONFIG);
    console.log("Raíz FTP:");
    const rootList = await client.list();
    rootList.forEach(item => console.log(`  ${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name}`));

    console.log("\npublic_html:");
    const pubList = await client.list("public_html");
    pubList.forEach(item => console.log(`  ${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name}`));

    console.log("\npublic_html/spinaz:");
    const spinazList = await client.list("public_html/spinaz");
    spinazList.forEach(item => console.log(`  ${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name}`));
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

inspect();
