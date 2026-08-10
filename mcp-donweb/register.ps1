$configPath = "C:\Users\trabajo ia\.gemini\config\mcp_config.json"
$raw = Get-Content $configPath -Raw
$json = $raw | ConvertFrom-Json

$serverPath = "c:\Users\trabajo ia\OneDrive\Escritorio\lava2\mcp-donweb\server.js"

$newServer = [PSCustomObject]@{
    command = "node"
    args    = @($serverPath)
}

$json.mcpServers | Add-Member -NotePropertyName "donweb" -NotePropertyValue $newServer -Force

$output = $json | ConvertTo-Json -Depth 10
Set-Content -Path $configPath -Value $output -Encoding UTF8
Write-Host "✅ MCP 'donweb' registrado correctamente en mcp_config.json"
