import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPINAZ_ROOT = path.resolve(__dirname, "..", "spinaz_garage_flota");

const CONFIG = {
  host: "a0170001.ferozo.com",
  user: "a0170001",
  password: "AuraFTP2025@aura",
  secure: true,
  secureOptions: { rejectUnauthorized: false },
  remoteRoot: "public_html/spinaz",
};

const SPINAZ_FILES = [
  "config.php",
  "setup_db.php",
  "auth.php",
  "vehicles.php",
  "taller.php",
  "daily_reports.php",
  "incidents.php",
  "payments.php",
  "announcements.php",
  "applicants.php",
  "upload.php",
  "check_table.php",
  "run_migration.php"
];

async function deploySpinazBackend() {
  console.log("🚀 Desplegando Backend PHP de Spinaz Garage a DonWeb (public_html/spinaz/)...");
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: CONFIG.host,
      user: CONFIG.user,
      password: CONFIG.password,
      secure: CONFIG.secure,
      secureOptions: CONFIG.secureOptions,
    });

    await client.ensureDir(CONFIG.remoteRoot);
    console.log("📂 Carpeta remota public_html/spinaz/ confirmada.");

    for (const file of SPINAZ_FILES) {
      const localPath = path.join(SPINAZ_ROOT, file);
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️ Archivo local no encontrado: ${file}`);
        continue;
      }
      const remotePath = `/public_html/spinaz/${file}`;
      await client.uploadFrom(localPath, remotePath);
      const size = (fs.statSync(localPath).size / 1024).toFixed(1);
      console.log(`✅ ${file} (${size} KB) subido con éxito.`);
    }

    console.log("\n🎉 ¡Backend PHP de Spinaz Garage desplegado y actualizado 100% en DonWeb!");
  } catch (err) {
    console.error("❌ Error en despliegue FTP:", err.message);
  } finally {
    client.close();
  }
}

deploySpinazBackend();
