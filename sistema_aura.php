<?php
// ==========================================================
// SISTEMA CENTRAL AURA - CONTADOR Y REGISTRO LEGAL
// Startup: Aura | Desarrollado para L1deres y Aura-Adamo
// ==========================================================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configuración de Seguridad para descargas a la PC de Omar
$clave_secreta = "AuraSegura2026";

$archivo_visitas_csv   = __DIR__ . '/registro_visitas.csv';
$archivo_afiliados_csv = __DIR__ . '/registro_afiliados.csv';

// Capturar IP real
$ip_usuario = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip_usuario = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
}
$fecha_servidor = date('Y-m-d H:i:s');
$accion = $_GET['accion'] ?? '';

// ----------------------------------------------------------
// 1. DESCARGA AUTOMÁTICA A LA PC DE OMAR (PowerShell)
// ----------------------------------------------------------
if ($accion === 'descargar_visitas' || $accion === 'descargar_afiliados') {
    if (!isset($_GET['clave']) || $_GET['clave'] !== $clave_secreta) {
        http_response_code(403);
        die("Acceso denegado: Clave de seguridad inválida.");
    }

    $archivo = ($accion === 'descargar_visitas') ? $archivo_visitas_csv : $archivo_afiliados_csv;
    $nombre_descarga = ($accion === 'descargar_visitas') ? "visitas_aura_" : "afiliados_lideres_";

    if (file_exists($archivo)) {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $nombre_descarga . date('Y-m-d') . '.csv"');
        readfile($archivo);
        exit;
    } else {
        die("Aún no hay registros guardados en este archivo.");
    }
}

// ----------------------------------------------------------
// 2. CONTADOR DE VISITAS PÚBLICO + LOG DETALLADO
// ----------------------------------------------------------
if ($accion === 'visita') {
    $sitio = isset($_GET['sitio']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['sitio']) : 'general';
    $archivo_conteo = __DIR__ . "/visitas_{$sitio}.txt";

    // Incrementar contador
    $visitas = 0;
    if (file_exists($archivo_conteo)) {
        $visitas = (int)file_get_contents($archivo_conteo);
    }
    $visitas++;
    file_put_contents($archivo_conteo, $visitas, LOCK_EX);

    // Registrar detalle
    $nuevo = !file_exists($archivo_visitas_csv);
    $fp = fopen($archivo_visitas_csv, 'a');
    if ($fp) {
        if ($nuevo) {
            fputcsv($fp, ['Fecha y Hora', 'Sitio Web', 'IP Visitante', 'Origen / Referencia', 'Dispositivo']);
        }
        fputcsv($fp, [
            $fecha_servidor,
            $sitio,
            $ip_usuario,
            $_SERVER['HTTP_REFERER'] ?? 'Directo',
            $_SERVER['HTTP_USER_AGENT'] ?? 'No especificado'
        ]);
        fclose($fp);
    }

    header('Content-Type: application/json');
    echo json_encode(['total' => $visitas]);
    exit;
}

// ----------------------------------------------------------
// 3. REGISTRO LEGAL DE AFILIADOS CON AUDITORÍA
// ----------------------------------------------------------
if ($accion === 'afiliacion' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $datos = json_decode(file_get_contents('php://input'), true);

    if (!$datos || empty($datos['nombre'])) {
        http_response_code(400);
        echo json_encode(['exito' => false, 'mensaje' => 'Faltan datos obligatorios.']);
        exit;
    }

    if (empty($datos['terminos_aceptados']) || $datos['terminos_aceptados'] !== true) {
        http_response_code(400);
        echo json_encode(['exito' => false, 'mensaje' => 'Debe aceptar los Términos y Condiciones.']);
        exit;
    }

    $nuevo = !file_exists($archivo_afiliados_csv);
    $fp = fopen($archivo_afiliados_csv, 'a');
    if ($fp) {
        if ($nuevo) {
            fputcsv($fp, [
                'Fecha Registro Servidor',
                'Nombre y Apellido',
                'Patente / Identificador',
                'Telefono',
                'Fecha Nacimiento',
                'Membresia',
                'Terminos Aceptados',
                'Version Terminos',
                'IP Prueba Digital'
            ]);
        }
        fputcsv($fp, [
            $fecha_servidor,
            $datos['nombre'],
            $datos['patente'] ?? 'N/A',
            $datos['telefono'] ?? 'N/A',
            $datos['fecha_nacimiento'] ?? 'N/A',
            $datos['tipo_membresia'] ?? 'socio',
            'SI - ACEPTO VOLUNTARIAMENTE',
            $datos['version_terminos'] ?? 'v1.0',
            $ip_usuario
        ]);
        fclose($fp);
    }

    header('Content-Type: application/json');
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Registro completado con respaldo legal.'
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Accion no valida']);
