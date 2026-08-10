#!/usr/bin/env node
/**
 * ============================================================
 * MCP Server: DonWeb / Ferozo Hosting Manager
 * Proyecto: Aura v1.6 - L1deres AutoWash
 * © 2026 Aura. Todos los derechos reservados.
 * ============================================================
 *
 * Herramientas disponibles:
 *  - deploy_file       → Sube un archivo al servidor Ferozo via FTPS
 *  - deploy_folder     → Sube todos los archivos de una carpeta local
 *  - list_files        → Lista archivos en un directorio del servidor
 *  - delete_file       → Elimina un archivo del servidor
 *  - create_directory  → Crea una carpeta en el servidor
 *  - get_config        → Muestra la configuración actual de la conexión
 *  - set_config        → Cambia host, usuario o contraseña FTP
 *  - ping_site         → Verifica si el sitio está en línea
 *  - ping_api          → Verifica si la API PHP está respondiendo
 *  - setup_db          → Inicializa / reinstala las tablas MySQL en DonWeb
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";
import https from "https";

// ============================================================
// CONFIGURACIÓN DE CONEXIÓN FEROZO
// ============================================================
const CONFIG = {
  // FTP / FTPS
  host: "a0170001.ferozo.com",
  user: "a0170001",
  password: "AuraFTP2025@aura",
  secure: true,
  secureOptions: { rejectUnauthorized: false },
  remoteRoot: "public_html",

  // URLs públicas
  siteUrl: "https://l1deres.site",
  adminUrl: "https://l1deres.site/admin",
  clientUrl: "https://l1deres.site/cliente",
  apiUrl: "https://l1deres.site/api",

  // MySQL
  db: {
    host: "localhost",
    name: "a0170001_lava2",
    user: "a0170001_lava2",
    password: "@Peloymago110Peloymago110",
  },
};

// ============================================================
// HELPER: Conectar al servidor FTP
// ============================================================
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

// ============================================================
// HELPER: Verificar si un sitio responde
// ============================================================
function checkSiteOnline(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      resolve({ online: true, status: res.statusCode, url });
    });
    req.on("error", () => resolve({ online: false, status: 0, url }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ online: false, status: "timeout", url });
    });
  });
}

// HELPER: Fetch JSON desde URL
function fetchJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve({ ok: true, status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ ok: true, status: res.statusCode, data: body }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

// ============================================================
// HERRAMIENTAS MCP
// ============================================================
const TOOLS = [
  {
    name: "deploy_file",
    description:
      "Sube un archivo local al servidor Ferozo via FTPS. Ideal para actualizar index.html, script.js, style.css u otros archivos de la app Aura v1.6.",
    inputSchema: {
      type: "object",
      properties: {
        localPath: {
          type: "string",
          description:
            "Ruta absoluta al archivo local. Ej: C:\\Users\\trabajo ia\\OneDrive\\Escritorio\\lava2\\script.js",
        },
        remotePath: {
          type: "string",
          description:
            "Ruta remota relativa a public_html. Ej: script.js o cliente/app.js",
        },
      },
      required: ["localPath", "remotePath"],
    },
  },
  {
    name: "deploy_folder",
    description:
      "Sube todos los archivos de una carpeta local al servidor Ferozo. Usa esto para hacer un deploy completo del Admin o del módulo Cliente.",
    inputSchema: {
      type: "object",
      properties: {
        localFolder: {
          type: "string",
          description:
            "Ruta absoluta a la carpeta local. Ej: C:\\Users\\trabajo ia\\OneDrive\\Escritorio\\lava2",
        },
        remoteFolder: {
          type: "string",
          description:
            "Carpeta destino relativa a public_html. Ej: '' para raíz o 'cliente' para la PWA",
        },
        extensions: {
          type: "array",
          items: { type: "string" },
          description:
            "Extensiones a incluir. Ej: ['.html', '.js', '.css', '.jpg', '.png']. Si se omite, sube todo.",
        },
      },
      required: ["localFolder", "remoteFolder"],
    },
  },
  {
    name: "list_files",
    description:
      "Lista todos los archivos y carpetas en un directorio del servidor Ferozo.",
    inputSchema: {
      type: "object",
      properties: {
        remotePath: {
          type: "string",
          description:
            "Ruta relativa a listar. Ej: '' para public_html raíz, 'cliente' para la carpeta del cliente.",
          default: "",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_file",
    description: "Elimina un archivo del servidor Ferozo.",
    inputSchema: {
      type: "object",
      properties: {
        remotePath: {
          type: "string",
          description:
            "Ruta relativa al archivo a eliminar. Ej: archivo_viejo.js o cliente/test.html",
        },
      },
      required: ["remotePath"],
    },
  },
  {
    name: "create_directory",
    description: "Crea una carpeta en el servidor Ferozo.",
    inputSchema: {
      type: "object",
      properties: {
        remotePath: {
          type: "string",
          description:
            "Nombre de la carpeta a crear relativa a public_html. Ej: assets o cliente/img",
        },
      },
      required: ["remotePath"],
    },
  },
  {
    name: "get_config",
    description:
      "Muestra la configuración actual de conexión al servidor Ferozo (FTP, URLs, MySQL). No muestra contraseñas.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "set_config",
    description:
      "Actualiza la configuración de conexión al servidor Ferozo (host, usuario, contraseña).",
    inputSchema: {
      type: "object",
      properties: {
        host: { type: "string", description: "Hostname FTP del servidor." },
        user: { type: "string", description: "Usuario FTP." },
        password: { type: "string", description: "Contraseña FTP." },
        siteUrl: { type: "string", description: "URL pública del sitio Landing." },
        adminUrl: { type: "string", description: "URL pública del Panel Admin." },
        clientUrl: { type: "string", description: "URL pública del sitio Cliente." },
        apiUrl: { type: "string", description: "URL pública de la API PHP." },
      },
      required: [],
    },
  },
  {
    name: "ping_site",
    description:
      "Verifica si el sitio web de L1deres (Landing, Admin y/o Cliente) está en línea y respondiendo correctamente.",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          enum: ["landing", "admin", "cliente", "todos"],
          description: "Qué sitio verificar: 'landing', 'admin', 'cliente' o 'todos'.",
          default: "todos",
        },
      },
      required: [],
    },
  },
  {
    name: "ping_api",
    description:
      "Verifica si la API PHP de DonWeb está funcionando correctamente. Consulta los endpoints de configuración, reservas y auth.",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          enum: ["configuracion", "reservas", "auth", "todos"],
          description: "Qué endpoint verificar.",
          default: "todos",
        },
      },
      required: [],
    },
  },
  {
    name: "setup_db",
    description:
      "Inicializa o reinstala las tablas MySQL en DonWeb ejecutando el script setup_db.php. Útil si la base de datos necesita ser recreada.",
    inputSchema: {
      type: "object",
      properties: {
        force: {
          type: "boolean",
          description: "Si true, usa el parámetro ?v=999 para forzar la reinstalación.",
          default: false,
        },
      },
      required: [],
    },
  },
];

// ============================================================
// IMPLEMENTACIÓN DE HERRAMIENTAS
// ============================================================
async function handleTool(name, args) {
  switch (name) {
    // ── deploy_file ──────────────────────────────────────────
    case "deploy_file": {
      const { localPath, remotePath } = args;
      if (!fs.existsSync(localPath)) {
        return { error: `Archivo no encontrado: ${localPath}` };
      }
      const client = await connectFTP();
      try {
        const fullRemote = `${CONFIG.remoteRoot}/${remotePath}`;
        await client.uploadFrom(localPath, fullRemote);
        const stats = fs.statSync(localPath);
        return {
          success: true,
          message: `✅ Archivo subido correctamente`,
          local: localPath,
          remote: fullRemote,
          size: `${(stats.size / 1024).toFixed(1)} KB`,
          server: CONFIG.host,
        };
      } finally {
        client.close();
      }
    }

    // ── deploy_folder ─────────────────────────────────────────
    case "deploy_folder": {
      const { localFolder, remoteFolder, extensions } = args;
      if (!fs.existsSync(localFolder)) {
        return { error: `Carpeta no encontrada: ${localFolder}` };
      }
      const client = await connectFTP();
      const results = { uploaded: [], skipped: [], errors: [] };
      try {
        const remoteBase = remoteFolder
          ? `${CONFIG.remoteRoot}/${remoteFolder}`
          : CONFIG.remoteRoot;

        try { await client.ensureDir(remoteBase); } catch (_) {}

        const files = fs.readdirSync(localFolder);
        for (const file of files) {
          const localFile = path.join(localFolder, file);
          const stat = fs.statSync(localFile);
          if (stat.isDirectory()) continue;

          const ext = path.extname(file).toLowerCase();
          if (extensions && extensions.length > 0 && !extensions.includes(ext)) {
            results.skipped.push(file);
            continue;
          }

          const remoteFile = `${remoteBase}/${file}`;
          try {
            await client.uploadFrom(localFile, remoteFile);
            results.uploaded.push({ file, size: `${(stat.size / 1024).toFixed(1)} KB` });
          } catch (err) {
            results.errors.push({ file, error: err.message });
          }
        }
        return {
          success: true,
          message: `✅ Deploy completado: ${results.uploaded.length} archivos subidos`,
          ...results,
          remoteBase,
        };
      } finally {
        client.close();
      }
    }

    // ── list_files ────────────────────────────────────────────
    case "list_files": {
      const remotePath = args.remotePath || "";
      const client = await connectFTP();
      try {
        const fullPath = remotePath
          ? `${CONFIG.remoteRoot}/${remotePath}`
          : CONFIG.remoteRoot;
        const list = await client.list(fullPath);
        return {
          path: fullPath,
          total: list.length,
          files: list.map((f) => ({
            name: f.name,
            type: f.isDirectory ? "📁 carpeta" : "📄 archivo",
            size: f.isDirectory ? "-" : `${(f.size / 1024).toFixed(1)} KB`,
            modified: f.modifiedAt ? f.modifiedAt.toISOString().substring(0, 10) : "-",
          })),
        };
      } finally {
        client.close();
      }
    }

    // ── delete_file ───────────────────────────────────────────
    case "delete_file": {
      const { remotePath } = args;
      const client = await connectFTP();
      try {
        const fullRemote = `${CONFIG.remoteRoot}/${remotePath}`;
        await client.remove(fullRemote);
        return { success: true, message: `🗑️ Archivo eliminado: ${fullRemote}` };
      } finally {
        client.close();
      }
    }

    // ── create_directory ──────────────────────────────────────
    case "create_directory": {
      const { remotePath } = args;
      const client = await connectFTP();
      try {
        const fullRemote = `${CONFIG.remoteRoot}/${remotePath}`;
        await client.ensureDir(fullRemote);
        return { success: true, message: `📁 Carpeta creada: ${fullRemote}` };
      } finally {
        client.close();
      }
    }

    // ── get_config ────────────────────────────────────────────
    case "get_config": {
      return {
        ftp: {
          host: CONFIG.host,
          user: CONFIG.user,
          password: "****** (oculta)",
          secure: CONFIG.secure,
          remoteRoot: CONFIG.remoteRoot,
        },
        urls: {
          landing: CONFIG.siteUrl,
          admin: CONFIG.adminUrl,
          cliente: CONFIG.clientUrl,
          api: CONFIG.apiUrl,
        },
        mysql: {
          host: CONFIG.db.host,
          database: CONFIG.db.name,
          user: CONFIG.db.user,
          password: "****** (oculta)",
        },
        version: "Aura v1.6 - L1deres AutoWash",
      };
    }

    // ── set_config ────────────────────────────────────────────
    case "set_config": {
      const changed = [];
      if (args.host)      { CONFIG.host = args.host; changed.push("host"); }
      if (args.user)      { CONFIG.user = args.user; changed.push("user"); }
      if (args.password)  { CONFIG.password = args.password; changed.push("password"); }
      if (args.siteUrl)   { CONFIG.siteUrl = args.siteUrl; changed.push("siteUrl"); }
      if (args.adminUrl)  { CONFIG.adminUrl = args.adminUrl; changed.push("adminUrl"); }
      if (args.clientUrl) { CONFIG.clientUrl = args.clientUrl; changed.push("clientUrl"); }
      if (args.apiUrl)    { CONFIG.apiUrl = args.apiUrl; changed.push("apiUrl"); }
      return {
        success: true,
        message: `✅ Configuración actualizada: ${changed.join(", ")}`,
        currentConfig: {
          host: CONFIG.host,
          user: CONFIG.user,
          siteUrl: CONFIG.siteUrl,
          adminUrl: CONFIG.adminUrl,
          clientUrl: CONFIG.clientUrl,
          apiUrl: CONFIG.apiUrl,
        },
      };
    }

    // ── ping_site ─────────────────────────────────────────────
    case "ping_site": {
      const target = args.target || "todos";
      const results = [];
      if (target === "landing" || target === "todos") {
        const r = await checkSiteOnline(CONFIG.siteUrl);
        results.push({ name: "Landing Page", ...r });
      }
      if (target === "admin" || target === "todos") {
        const r = await checkSiteOnline(CONFIG.adminUrl);
        results.push({ name: "Panel Admin", ...r });
      }
      if (target === "cliente" || target === "todos") {
        const r = await checkSiteOnline(CONFIG.clientUrl);
        results.push({ name: "PWA Cliente", ...r });
      }
      const allOnline = results.every((r) => r.online);
      return {
        status: allOnline ? "✅ Todo en línea" : "⚠️ Algún sitio no responde",
        results,
        checkedAt: new Date().toISOString(),
      };
    }

    // ── ping_api ──────────────────────────────────────────────
    case "ping_api": {
      const endpoint = args.endpoint || "todos";
      const results = [];

      const endpoints = {
        configuracion: `${CONFIG.apiUrl}/configuracion.php`,
        reservas: `${CONFIG.apiUrl}/reservas.php`,
        auth: `${CONFIG.apiUrl}/auth.php`,
      };

      const toCheck = endpoint === "todos"
        ? Object.entries(endpoints)
        : [[endpoint, endpoints[endpoint]]].filter(([, v]) => v);

      for (const [name, url] of toCheck) {
        const r = await fetchJson(url);
        results.push({
          endpoint: name,
          url,
          online: r.ok,
          status: r.status || 0,
          response: r.data || r.error,
        });
      }

      const allOk = results.every((r) => r.online);
      return {
        status: allOk ? "✅ API funcionando correctamente" : "⚠️ Algún endpoint no responde",
        db: `${CONFIG.db.name} @ ${CONFIG.db.host}`,
        results,
        checkedAt: new Date().toISOString(),
      };
    }

    // ── setup_db ──────────────────────────────────────────────
    case "setup_db": {
      const force = args.force !== false;
      const url = `${CONFIG.apiUrl}/setup_db.php${force ? "?v=999" : ""}`;
      const r = await fetchJson(url);
      return {
        success: r.ok && r.data?.success,
        url,
        response: r.data || r.error,
        db: CONFIG.db.name,
        message: r.data?.success
          ? `✅ Base de datos ${CONFIG.db.name} inicializada correctamente`
          : `⚠️ Revisar respuesta del servidor`,
      };
    }

    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

// ============================================================
// SERVIDOR MCP
// ============================================================
const server = new Server(
  {
    name: "donweb-ferozo",
    version: "1.6.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: err.message, tool: name }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
