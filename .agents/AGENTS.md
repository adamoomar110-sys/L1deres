# Reglas del Proyecto — Lavadero de Lujo (L1DERES)

## Arquitectura del Deploy

Este proyecto tiene una estructura de **doble directorio**. Los archivos fuente viven en la **raíz** del proyecto y se copian manualmente a `web/public/` antes de hacer deploy a Vercel.

### Regla Crítica: Sincronización Raíz → web/public/

> **NUNCA** editar archivos solo en la raíz sin copiarlos a `web/public/`.
> **NUNCA** editar archivos solo en `web/public/` sin actualizar la raíz.
> **SIEMPRE** que modifiques un archivo, copiarlo al otro directorio antes de hacer git commit.

**Archivos que DEBEN estar sincronizados:**

| Archivo | Descripción |
|---|---|
| `index.html` | Panel de administración principal |
| `app.js` | Lógica central del sistema (Supabase, renderizado, botones) |
| `estilos.css` | Hoja de estilos del panel admin (¡NO confundir con style.css!) |
| `style.css` | Hoja de estilos para pantallas secundarias (tv_espera, tablet, etc.) |
| `logo.png` | Logo L1DERES — usado en header, kiosko y service worker |
| `kiosko.html` | Pantalla kiosko público |
| `cliente.html` | Landing page del cliente |
| `app_cliente.html` | Tracking en vivo del cliente (se conecta directo a Supabase) |
| `tablet_pista.html` | Tablet unificada de pista (recepción y taller) |
| `camera_ia.js` | Lógica central unificada de cámara con IA Visual (Gemini) |
| `tv_espera.html` | Monitor de sala de espera |
| `tv_precios.html` | Cartelería de precios |
| `offline.html` | Fallback del service worker |
| `sw.js` | Service worker para PWA |
| `manifest-kiosko.json` | Manifest PWA del kiosko |

### Comando de sincronización obligatorio antes de cada push:

```powershell
Copy-Item -Path index.html, app.js, estilos.css, logo.png, kiosko.html, cliente.html, app_cliente.html, tablet_pista.html, tv_espera.html, tv_precios.html, offline.html, sw.js, manifest-kiosko.json, camera_ia.js -Destination web/public/ -Force
```

---

## Supabase — Reglas de Conexión

### Credenciales hardcoded (fallback)
Las credenciales de Supabase están hardcoded en `app.js` como fallback cuando `/api/config` no está disponible:
- URL: `https://hacmhlyvyyysnvekvhya.supabase.co`
- Key: `sb_publishable_oEB1MoOee7lM99mvHCu_aA_T98vg3NA`
- Tabla principal: `lavadero_camera_queue`
- Tabla de servicios: `service_orders`

### Template literals — BUG RECURRENTE

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

### Módulos que se conectan a Supabase

Cada pantalla tiene su propia conexión a Supabase. Al agregar una nueva funcionalidad, verificar que TODOS estos módulos estén actualizados:

1. **app.js** — Panel principal (fetchSupabase, realtime, sync)
2. **kiosko.html** — Kiosko público (inserta en lavadero_camera_queue)
3. **tablet_ingreso.html** — Tablet de recepción (inserta vehículos)
4. **tablet_taller.html** — Tablet taller (lee y actualiza zonas via REST)
5. **tv_espera.html** — TV sala de espera (polling cada 5s)
6. **app_cliente.html** — App cliente (polling con URL hardcoded)

---

## Zonas del Sistema (Flujo FIFO)

El sistema opera con orden de llegada. Las zonas son:

```
reservado → pre_espera → espera → lavado → aspirado → terminado
```

- **reservado**: Auto cargado por el cliente online, esperando confirmación de cámara/domo
- **pre_espera**: Ingreso inteligente (auto detectado por la cámara, pendiente de entrar a fila)
- **espera**: En la cola de lavado (FIFO)
- **lavado**: En el túnel de lavado (solo 1 auto a la vez)
- **aspirado**: En zona de aspirado
- **terminado**: Listo para retirar

Cuando agregues una nueva zona o modifiques el flujo, actualizar en TODOS estos lugares:
1. `app.js` → `renderOperatorTable()` (dropdown de zonas)
2. `app.js` → botón "Avanzar" (lógica de nextZone)
3. `tablet_taller.html` → botones de acción por zona
4. `tv_espera.html` → filtros de zona en preparación/listo
5. `kiosko.html` → `renderQueuePanel()` filtros de zona

---

## Encoding y Emojis

> **NUNCA** guardar archivos con encoding que corrompa emojis.
> Si ves emojis como `ðŸ–¨ï¸` o `Í°Å¸` en el HTML, están CORRUPTOS y deben ser reemplazados por el emoji correcto en UTF-8.

---

## Git y Deploy

- Repositorio: `github.com/adamoomar110-sys/lavadero-de-lujo`
- Branch de deploy: `main`
- Directorio de deploy en Vercel: `web/public/`
- Deploy automático al hacer push a `main`
- El framework Next.js maneja las API routes (`web/src/app/api/`)

### Checklist pre-push obligatorio:
1. ✅ Archivos editados copiados de raíz a `web/public/`
2. ✅ Verificar que `estilos.css`, `style.css`, `logo.png` existan en `web/public/`
3. ✅ Verificar template literals de Supabase (backticks, no backslashes)
4. ✅ Verificar emojis no estén corruptos
5. ✅ Verificar que todas las zonas nuevas estén en todos los módulos

---

## Branding

- **Startup**: Aura
- **Footer obligatorio**: `© 2026 Aura. Todos los derechos reservados.`
- **Negocio**: L1DERES Lavadero de Lujo
- **Propietario del proyecto**: Omar

## Privacidad

- Las patentes en pantallas públicas (tv_espera.html) deben estar **enmascaradas**: `***` + últimos 3 caracteres
- En el panel de administración se muestran completas
