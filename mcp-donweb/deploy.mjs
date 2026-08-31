#!/usr/bin/env node
/**
 * ================================================================
 * Deploy FTP a DonWeb/Ferozo — PROYECTO: L1deres AutoWash
 * ================================================================
 * ⚠️  ESTE SCRIPT SOLO TOCA LA CARPETA: public_html/
 *     NO modifica nada de public_html/aura-adamo/ (otro proyecto)
 *
 * Niveles: Landing | Admin | Cliente | API
 * FTP:  a0170001 @ a0170001.ferozo.com
 * ================================================================
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
  // ⚠️ RAÍZ de L1deres — NO cambiar
  remoteRoot: "public_html",
};

// ⚠️ Archivos de la Landing Comercial de L1deres (Raíz public_html/)
// NOTA: .htaccess incluye las reglas multi-dominio que separan
//       aura-adamo.site de l1deres.site — NO eliminar esa regla
const LANDING_FILES = [
  "index.html",
  "style.css",
  "script.js",
  ".htaccess",         // ← Contiene reglas para separar aura-adamo.site
  "logo.jpg",
  "logo_horizontal.jpg",
  "logo_icon.jpg",
  "render_fachada.jpg",
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
  "logo_horizontal.jpg",
  "logo_icon.jpg",
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
  "logo.jpg",
  "logo_horizontal.jpg",
  "logo_icon.jpg",
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
  "socios_fundadores.php",
  "sponsors.php",
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
  console.log("🌐 [1/4] DEPLOY LANDING COMERCIAL (public_html/)");
  console.log("─".repeat(45));
  for (const file of LANDING_FILES) {
    const local = path.join(ROOT, file);
    if (!fs.existsSync(local)) { console.log(`  ⏭️  ${file} (no existe localmente, omitido)`); continue; }
    const remote = `${CONFIG.remoteRoot}/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ ${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ ${file} → Error: ${err.message}`);
    } finally { client.close(); }
  }
}

async function deployAdmin() {
  console.log("\n🔒 [2/4] DEPLOY ADMIN DASHBOARD (public_html/admin/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try { await setupClient.ensureDir(`${CONFIG.remoteRoot}/admin`); console.log("  📂 Carpeta admin/ lista"); }
  finally { setupClient.close(); }
  for (const file of ADMIN_FILES) {
    const local = path.join(ROOT, "admin", file);
    if (!fs.existsSync(local)) { console.log(`  ⏭️  admin/${file} (no existe localmente, omitido)`); continue; }
    const remote = `${CONFIG.remoteRoot}/admin/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ admin/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ admin/${file} → Error: ${err.message}`);
    } finally { client.close(); }
  }
}

async function deployCliente() {
  console.log("\n📱 [3/4] DEPLOY APP CLIENTE PWA (public_html/cliente/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try { await setupClient.ensureDir(`${CONFIG.remoteRoot}/cliente`); console.log("  📂 Carpeta cliente/ lista"); }
  finally { setupClient.close(); }
  for (const file of CLIENT_FILES) {
    const local = path.join(ROOT, "cliente", file);
    if (!fs.existsSync(local)) { console.log(`  ⏭️  cliente/${file} (no existe localmente, omitido)`); continue; }
    const remote = `${CONFIG.remoteRoot}/cliente/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ cliente/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ cliente/${file} → Error: ${err.message}`);
    } finally { client.close(); }
  }
}

async function deployApi() {
  console.log("\n⚡ [4/4] DEPLOY BACKEND API PHP (public_html/api/)");
  console.log("─".repeat(45));
  const setupClient = await connectFTP();
  try { await setupClient.ensureDir(`${CONFIG.remoteRoot}/api`); console.log("  📂 Carpeta api/ lista"); }
  finally { setupClient.close(); }
  for (const file of API_FILES) {
    const local = path.join(ROOT, "api", file);
    if (!fs.existsSync(local)) { console.log(`  ⏭️  api/${file} (no existe localmente, omitido)`); continue; }
    const remote = `${CONFIG.remoteRoot}/api/${file}`;
    const client = await connectFTP();
    try {
      await client.uploadFrom(local, remote);
      const size = (fs.statSync(local).size / 1024).toFixed(1);
      console.log(`  ✅ api/${file} (${size} KB)`);
    } catch (err) {
      console.log(`  ❌ api/${file} → Error: ${err.message}`);
    } finally { client.close(); }
  }
}

async function deploy() {
  try {
    console.log("🚀 DEPLOY L1DERES AUTOWASH → l1deres.site\n");
    console.log("⚠️  Este script NO toca public_html/aura-adamo/ (proyecto separado)\n");
    await deployLanding();
    await deployAdmin();
    await deployCliente();
    await deployApi();
    console.log("\n🎉 DESPLIEGUE COMPLETADO CON ÉXITO");
    console.log("─".repeat(50));
    console.log("  🌐 Landing:  https://l1deres.site");
    console.log("  📱 Cliente:  https://l1deres.site/cliente/");
    console.log("  🔒 Admin:    https://l1deres.site/admin/");
    console.log("  ⚡ API:      https://l1deres.site/api/");
  } catch (err) {
    console.error("\n❌ ERROR DE CONEXIÓN FTP:", err.message);
    process.exit(1);
  }
}

deploy();
