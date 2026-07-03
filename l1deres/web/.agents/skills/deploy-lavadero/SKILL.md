---
name: deploy-lavadero
description: >
  Verificar y desplegar el proyecto Lavadero de Lujo a Vercel.
  Usar SIEMPRE antes de hacer git push. Sincroniza archivos de raíz a web/public/,
  verifica assets, conexiones Supabase, template literals y encoding.
  Activar cuando el usuario diga "subilo", "deploy", "push", "desplegalo" o similar.
---

# Skill: Deploy Lavadero de Lujo

## Cuándo usar este skill
- Cuando el usuario pida "subilo", "guardalo y subilo", "deploy", "push"
- Después de editar CUALQUIER archivo HTML, JS o CSS del proyecto
- Cuando se agregue una nueva zona o funcionalidad a múltiples pantallas

## Paso 1: Sincronizar archivos

Copiar TODOS los archivos editables de la raíz a `web/public/`:

```powershell
Copy-Item -Path index.html, app.js, estilos.css, logo.png, kiosko.html, cliente.html, app_cliente.html, tablet_ingreso.html, tablet_taller.html, tv_espera.html, tv_precios.html, postular.html, offline.html, sw.js, manifest-kiosko.json -Destination web/public/ -Force
```

## Paso 2: Verificar sincronización

Ejecutar este script para verificar que todos los archivos estén sincronizados:

```powershell
$files = @("index.html", "app.js", "estilos.css", "logo.png", "kiosko.html", "cliente.html", "app_cliente.html", "tablet_ingreso.html", "tablet_taller.html", "tv_espera.html", "tv_precios.html", "postular.html", "offline.html", "sw.js")
$ok = $true
foreach ($f in $files) {
    $r = if (Test-Path $f) { (Get-Item $f).Length } else { 0 }
    $w = if (Test-Path "web/public/$f") { (Get-Item "web/public/$f").Length } else { 0 }
    if ($r -ne $w) { Write-Host "ERROR: $f desincronizado (raiz=$r web=$w)"; $ok = $false }
}
if ($ok) { Write-Host "Todos los archivos sincronizados OK" }
```

## Paso 3: Verificar template literals de Supabase

Buscar backslashes incorrectos en template literals:

```powershell
Select-String -Path web/public/*.html, web/public/app.js -Pattern '\\Bearer \\|\\rest/v1' | ForEach-Object { Write-Host "BUG CRITICO en $($_.Filename):$($_.LineNumber) - template literal con backslash" }
```

Si encuentra resultados, hay un bug. Los template literals deben usar backticks:
- `` `${config.supabaseUrl}/rest/v1/...` ``
- `` `Bearer ${config.supabaseKey}` ``

## Paso 4: Verificar emojis corruptos

```powershell
Select-String -Path web/public/*.html -Pattern 'ðŸ|Í°Å¸|â‚¬' | ForEach-Object { Write-Host "EMOJI CORRUPTO en $($_.Filename):$($_.LineNumber)" }
```

## Paso 5: Verificar assets críticos

```powershell
$critical = @("estilos.css", "style.css", "logo.png", "offline.html")
foreach ($f in $critical) {
    if (-not (Test-Path "web/public/$f")) { Write-Host "FALTANTE CRITICO: $f" }
}
```

## Paso 6: Git commit y push

```powershell
cd web
git add -A public/
git commit -m "descripcion del cambio"
git push origin main
```

## Errores comunes a evitar

1. **Editar solo en raíz sin copiar a web/public/** → El deploy en Vercel no refleja los cambios
2. **Editar solo en web/public/** → Se pierden los cambios al próxima sincronización
3. **Template literals con backslash** → La conexión a Supabase falla silenciosamente
4. **Olvidar estilos.css o logo.png** → El panel admin se ve roto sin estilos ni logo
5. **Agregar zona nueva solo en app.js** → Las tablets y TVs no la muestran
6. **Emojis corruptos** → Se ve texto basura en los botones
