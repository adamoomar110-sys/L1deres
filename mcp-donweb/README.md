# MCP Server: DonWeb / Ferozo Hosting Manager

Este servidor MCP te permite controlar el hosting de DonWeb/Ferozo 
directamente desde el chat sin necesidad de abrir el panel web.

## Herramientas disponibles

| Herramienta | Qué hace |
|---|---|
| `deploy_file` | Sube un archivo específico al servidor (ej: script.js actualizado) |
| `deploy_folder` | Sube toda una carpeta (deploy completo del Admin o PWA Cliente) |
| `list_files` | Lista archivos en cualquier directorio del servidor |
| `delete_file` | Elimina un archivo del servidor |
| `create_directory` | Crea una nueva carpeta en el servidor |
| `get_config` | Muestra la configuración actual (host, usuario, URLs) |
| `set_config` | Cambia host, usuario, contraseña o URLs del sitio |
| `ping_site` | Verifica si el Admin y/o la PWA Cliente están en línea |

## Datos de conexión configurados

- **Host FTP:** a0170001.ferozo.com
- **Usuario:** a0170001
- **Protocolo:** FTPS (FTP sobre SSL)
- **Raíz remota:** public_html/
- **Sitio Admin:** https://l1deres.site
- **Sitio Cliente:** https://l1deres.site/cliente

## Cómo activarlo en Antigravity IDE

Agregá esta entrada en tu archivo:
`C:\Users\trabajo ia\.gemini\config\mcp_config.json`

```json
"donweb": {
  "command": "node",
  "args": [
    "c:\\Users\\trabajo ia\\OneDrive\\Escritorio\\lava2\\mcp-donweb\\server.js"
  ]
}
```

## Ejemplos de uso en el chat

- *"subí el script.js actualizado al servidor"*
- *"hacé deploy completo del Admin"*
- *"listá los archivos en el servidor"*
- *"verificá si el sitio está online"*
- *"cambiá la contraseña FTP a [nueva clave]"*

## Estructura de archivos

```
mcp-donweb/
├── server.js       ← Servidor MCP principal (8 herramientas)
├── package.json    ← Dependencias: @modelcontextprotocol/sdk, basic-ftp
└── README.md       ← Esta documentación
```

---
© 2026 Aura · Todos los derechos reservados.
