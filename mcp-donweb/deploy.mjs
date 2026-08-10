#!/usr/bin/env node
/**
 * Deploy FTP a DonWeb/Ferozo (4 Niveles: Landing, Admin, Cliente, API)
 * Aura v1.6 - L1deres AutoWash
 * MySQL: a0170001_lava2 @ localhost
 * FTP:   a0170001 @ a0170001.ferozo.com
 */
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CONFIG = {
  host: "a0170001.ferozo.com",
  user: "a0170001",
  password: "AuraFTP2025@aura",
  secure: true,
  secureOptions: { rejectUnauthorized: false },
  remoteRoot: "public_html",
};

// Archivos Landing Comercial (Raíz)
const LANDING_FILES = [
  "index.html",
  "style.css",
  "script.js",
  ".htaccess",
  "logo.jpg",
  "background_neon.png",
  "f1_car_side.png",
  "f1_car_top_down.png",
  "google9df6cc515d5bd125.html",
  "OneSignalSDKWorker.js",
];

// Archivos Dashboard Admin (/admin/)
const ADMIN_FILES = [
  "index.html",
  "style.css",
  "script.js",
  ".htaccess",
  "logo.jpg",
  "background_neon.png",
  "f1_car_side.png",
  "f1_car_top_down.png",
];

// Archivos App Cliente (/cliente/)
const CLIENT_FILES = [
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "sw.js",
  ".htaccess",
  "f1_car_top_down.png",
  "google9df6cc515d5bd125.html",
  "OneSignalSDKWorker.js",
  "onesignal_service.js",
];

// Archivos API PHP Backend (/api/)
const API_FILES = [
  "config.php",
  "configuracion.php",
  "reservas.php",
  "auth.php",
  "resenas.php",
  "setup_db.php",
  "push.php",
];

async function connectFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  await client.access({
    host: CONFIG.host,
    user: CONFIG.user,
    password: CONFIG.password,
    secure: CONFIG.secure,
    secureOptions: CONFIG.secureOptions,
  });
  return client;
}

async function deployLanding() {
  console.log("🌐 [1/3] DEPLOY LANDING COMERCIAL (public_html/)");
  console.log("─".repeat(45));
  for (const file of LANDING_FILES) {
    const local = path.join(ROOT, file);
    if (!fs.existsSync(local)) continue;
    const remote = `${CONFIG.remoteRoot}/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ ${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ ${file} → Error: ${err.message}`);
    } finally {
      client.close();
    }
  }
}

async function deployAdmin() {
  console.log("\n🔒 [2/3] DEPLOY ADMIN DASHBOARD (public_html/admin/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try {
    await setupClient.ensureDir(`${CONFIG.remoteRoot}/admin`);
    console.log("  📂 Carpeta public_html/admin/ lista");
  } finally {
    setupClient.close();
  }

  for (const file of ADMIN_FILES) {
    const local = path.join(ROOT, "admin", file);
    if (!fs.existsSync(local)) continue;
    const remote = `${CONFIG.remoteRoot}/admin/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ admin/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ admin/${file} → Error: ${err.message}`);
    } finally {
      client.close();
    }
  }
}

async function deployCliente() {
  console.log("\n📱 [3/3] DEPLOY APP CLIENTE PWA (public_html/cliente/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try {
    await setupClient.ensureDir(`${CONFIG.remoteRoot}/cliente`);
    console.log("  📂 Carpeta public_html/cliente/ lista");
  } finally {
    setupClient.close();
  }

  for (const file of CLIENT_FILES) {
    const local = path.join(ROOT, "cliente", file);
    if (!fs.existsSync(local)) continue;
    const remote = `${CONFIG.remoteRoot}/cliente/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ cliente/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ cliente/${file} → Error: ${err.message}`);
    } finally {
      client.close();
    }
  }
}

async function deployApi() {
  console.log("\n⚡ [4/4] DEPLOY BACKEND API PHP (public_html/api/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try {
    await setupClient.ensureDir(`${CONFIG.remoteRoot}/api`);
    console.log("  📂 Carpeta public_html/api/ lista");
  } finally {
    setupClient.close();
  }

  for (const file of API_FILES) {
    const local = path.join(ROOT, "api", file);
    if (!fs.existsSync(local)) continue;
    const remote = `${CONFIG.remoteRoot}/api/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ api/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ api/${file} → Error: ${err.message}`);
    } finally {
      client.close();
    }
  }
}

async function deploy() {
  try {
    console.log("🚀 INICIANDO DESPLIEGUE MULTI-NIVEL EN DONWEB (l1deres.site)\n");
    await deployLanding();
    await deployAdmin();
    await deployCliente();
    await deployApi();

    console.log("\n🎉 DESPLIEGUE MULTI-NIVEL COMPLETADO CON ÉXITO");
    console.log("─".repeat(50));
    console.log("  🌐 Landing Page Comercial: https://l1deres.site");
    console.log("  📱 App Cliente (PWA):       https://l1deres.site/cliente/");
    console.log("  🔒 Admin Dashboard:         https://l1deres.site/admin/");
    console.log("  ⚡ Backend API PHP:          https://l1deres.site/api/");
  } catch (err) {
    console.error("\n❌ ERROR DE CONEXIÓN FTP:");
    console.error(err.message);
    process.exit(1);
  }
}

deploy();
