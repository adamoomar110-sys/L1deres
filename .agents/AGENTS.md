# Reglas del Proyecto â€” Lavadero de Lujo (L1DERES)

## Arquitectura del Deploy

Este proyecto tiene una estructura de **doble directorio**. Los archivos fuente viven en la **raÃ­z** del proyecto y se copian manualmente a `web/public/` antes de hacer deploy a Vercel.

### Regla CrÃ­tica: SincronizaciÃ³n RaÃ­z â†’ web/public/

> **NUNCA** editar archivos solo en la raÃ­z sin copiarlos a `web/public/`.
> **NUNCA** editar archivos solo en `web/public/` sin actualizar la raÃ­z.
> **SIEMPRE** que modifiques un archivo, copiarlo al otro directorio antes de hacer git commit.

**Archivos que DEBEN estar sincronizados:**

| Archivo | DescripciÃ³n |
|---|---|
| `index.html` | Panel de administraciÃ³n principal |
| `app.js` | LÃ³gica central del sistema (Supabase, renderizado, botones) |
| `estilos.css` | Hoja de estilos del panel admin (Â¡NO confundir con style.css!) |
| `style.css` | Hoja de estilos para pantallas secundarias (tv_espera, tablet, etc.) |
| `logo.png` | Logo L1DERES â€” usado en header, pwa_cliente y service worker |
| `pwa_cliente.html` | Pantalla pwa_cliente pÃºblico |
| `cliente.html` | Landing page del cliente |
| `tablet_pista.html` | Tablet unificada de pista (recepciÃ³n y taller) |
| `camera_ia.js` | LÃ³gica central unificada de cÃ¡mara con IA Visual (Gemini) |
| `tv_espera.html` | Monitor de sala de espera |
| `tv_precios.html` | CartelerÃ­a de precios |
| `offline.html` | Fallback del service worker |
| `sw.js` | Service worker para PWA |
| `manifest-pwa_cliente.json` | Manifest PWA del pwa_cliente |

### Comando de sincronizaciÃ³n obligatorio antes de cada push:

```powershell
Copy-Item -Path index.html, app.js, estilos.css, logo.png, pwa_cliente.html, cliente.html, tablet_pista.html, tv_espera.html, tv_precios.html, offline.html, sw.js, manifest-pwa_cliente.json, camera_ia.js -Destination web/public/ -Force
```

---

## Supabase â€” Reglas de ConexiÃ³n

### Credenciales hardcoded (fallback)
Las credenciales de Supabase estÃ¡n hardcoded en `app.js` como fallback cuando `/api/config` no estÃ¡ disponible:
- URL: `https://hacmhlyvyyysnvekvhya.supabase.co`
- Key: `sb_publishable_oEB1MoOee7lM99mvHCu_aA_T98vg3NA`
- Tabla principal: `lavadero_camera_queue`
- Tabla de servicios: `service_orders`

### Template literals â€” BUG RECURRENTE

> **NUNCA** usar backslashes `\` dentro de template literals de JavaScript.
> **SIEMPRE** usar backticks `` ` `` para template literals con `${}`.

**INCORRECTO (causa errores silenciosos):**
```javascript
const url = \/rest/v1/\?select=*;
const auth = \Bearer \;
```

**CORRECTO:**
```javascript
const url = `${config.supabaseUrl}/rest/v1/${config.queueTable}?select=*`;
const auth = `Bearer ${config.supabaseKey}`;
```

### MÃ³dulos que se conectan a Supabase

Cada pantalla tiene su propia conexiÃ³n a Supabase. Al agregar una nueva funcionalidad, verificar que TODOS estos mÃ³dulos estÃ©n actualizados:

1. **app.js** â€” Panel principal (fetchSupabase, realtime, sync)
2. **pwa_cliente.html** â€” pwa_cliente pÃºblico (inserta en lavadero_camera_queue)
3. **tablet_ingreso.html** â€” Tablet de recepciÃ³n (inserta vehÃ­culos)
4. **tablet_taller.html** â€” Tablet taller (lee y actualiza zonas via REST)
5. **tv_espera.html** â€” TV sala de espera (polling cada 5s)

---

## Zonas del Sistema (Flujo FIFO)

El sistema opera con orden de llegada. Las zonas son:

```
reservado â†’ pre_espera â†’ espera â†’ lavado â†’ aspirado â†’ terminado
```

- **reservado**: Auto cargado por el cliente online, esperando confirmaciÃ³n de cÃ¡mara/domo
- **pre_espera**: Ingreso inteligente (auto detectado por la cÃ¡mara, pendiente de entrar a fila)
- **espera**: En la cola de lavado (FIFO)
- **lavado**: En el tÃºnel de lavado (solo 1 auto a la vez)
- **aspirado**: En zona de aspirado
- **terminado**: Listo para retirar

Cuando agregues una nueva zona o modifiques el flujo, actualizar en TODOS estos lugares:
1. `app.js` â†’ `renderOperatorTable()` (dropdown de zonas)
2. `app.js` â†’ botÃ³n "Avanzar" (lÃ³gica de nextZone)
3. `tablet_taller.html` â†’ botones de acciÃ³n por zona
4. `tv_espera.html` â†’ filtros de zona en preparaciÃ³n/listo
5. `pwa_cliente.html` â†’ `renderQueuePanel()` filtros de zona

---

## Encoding y Emojis

> **NUNCA** guardar archivos con encoding que corrompa emojis.
> Si ves emojis como `Ã°Å¸â€“Â¨Ã¯Â¸` o `ÃÂ°Ã…Â¸` en el HTML, estÃ¡n CORRUPTOS y deben ser reemplazados por el emoji correcto en UTF-8.

---

## Git y Deploy

- Repositorio: `github.com/adamoomar110-sys/lavadero-de-lujo`
- Branch de deploy: `main`
- Directorio de deploy en Vercel: `web/public/`
- Deploy automÃ¡tico al hacer push a `main`
- El framework Next.js maneja las API routes (`web/src/app/api/`)

### Checklist pre-push obligatorio:
1. âœ… Archivos editados copiados de raÃ­z a `web/public/`
2. âœ… Verificar que `estilos.css`, `style.css`, `logo.png` existan en `web/public/`
3. âœ… Verificar template literals de Supabase (backticks, no backslashes)
4. âœ… Verificar emojis no estÃ©n corruptos
5. âœ… Verificar que todas las zonas nuevas estÃ©n en todos los mÃ³dulos

---

## Branding

- **Startup**: Aura
- **Footer obligatorio**: `Â© 2026 Aura. Todos los derechos reservados.`
- **Negocio**: L1DERES Lavadero de Lujo
- **Propietario del proyecto**: Omar

## Privacidad

- Las patentes en pantallas pÃºblicas (tv_espera.html) deben estar **enmascaradas**: `***` + Ãºltimos 3 caracteres
- En el panel de administraciÃ³n se muestran completas


## Enlaces (Links)

- **Regla Obligatoria**: Cuando el usuario solicite los links del proyecto, DEBEN ser auto-direccionables (cliqueables) hacia el navegador usando el formato absoluto (ej. `https://lavadero-de-lujo.vercel.app/[archivo]`). No usar rutas relativas puras, sino URLs completas listas para que el usuario navegue directamente con un clic.
