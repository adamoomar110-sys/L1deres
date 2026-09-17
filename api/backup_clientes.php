<?php
// ============================================================
// SISTEMA DE RESGUARDO AUTOMÁTICO DE CLIENTES (Aura / L1deres)
// Escribe inmediatamente cada cliente en archivo físico inmutable
// tanto en CSV (formato Excel con UTF-8 BOM) como en JSONL
// ============================================================

function registrarClienteResguardoDonWeb($datos) {
    try {
        $backupDir = __DIR__ . '/backups';
        if (!file_exists($backupDir)) {
            @mkdir($backupDir, 0755, true);
        }

        // Proteger directorio para que nadie lo pueda descargar directamente por URL
        $htaccessPath = $backupDir . '/.htaccess';
        if (!file_exists($htaccessPath)) {
            @file_put_contents($htaccessPath, "Order deny,allow\nDeny from all\n");
        }

        $csvFile = $backupDir . '/clientes_resguardo.csv';
        $jsonlFile = $backupDir . '/clientes_resguardo.jsonl';

        // Si el archivo CSV no existe, crear con BOM UTF-8 y encabezados
        if (!file_exists($csvFile) || filesize($csvFile) === 0) {
            $header = "\xEF\xBB\xBF" . "FECHA Y HORA;TIPO REGISTRO;NUMERO SOCIO;PATENTE;TITULAR;TELEFONO;EMAIL;MODELO;SERVICIO;PRECIO;METODO PAGO;ESTADO;NOTAS\r\n";
            @file_put_contents($csvFile, $header);
        }

        // Sanitizar campos para CSV (evitar saltos de línea y escapar punto y coma)
        $clean = function($val) {
            $s = trim(strval($val ?? ''));
            $s = str_replace(["\r", "\n", "\t"], ' ', $s);
            if (strpos($s, ';') !== false || strpos($s, '"') !== false) {
                $s = '"' . str_replace('"', '""', $s) . '"';
            }
            return $s;
        };

        $fechaHora = date('Y-m-d H:i:s');
        $tipoRegistro = $clean($datos['tipo_registro'] ?? 'CLIENTE_PISTA');
        $numeroSocio  = $clean($datos['numero_socio'] ?? $datos['numero'] ?? '');
        $patente      = strtoupper($clean($datos['patente'] ?? 'S/D'));
        $titular      = $clean($datos['titular'] ?? $datos['nombre'] ?? $datos['cliente_nombre'] ?? 'Cliente General');
        $telefono     = $clean($datos['telefono'] ?? $datos['cliente_telefono'] ?? '');
        $email        = $clean($datos['email'] ?? '');
        $modelo       = $clean($datos['modelo'] ?? $datos['modelo_auto'] ?? 'Auto / Camioneta');
        $servicio     = $clean($datos['servicio'] ?? $datos['tipo_lavado'] ?? $datos['tipo_servicio'] ?? 'express_auto');
        $precio       = $clean($datos['precio'] ?? $datos['monto'] ?? $datos['monto_pagado'] ?? '0');
        $metodoPago   = $clean($datos['metodo_pago'] ?? $datos['metodo'] ?? 'efectivo');
        $estado       = $clean($datos['estado'] ?? $datos['estado_pago'] ?? 'pagado');
        $notas        = $clean($datos['notas'] ?? $datos['observaciones'] ?? '');

        $csvLine = implode(';', [
            $fechaHora,
            $tipoRegistro,
            $numeroSocio,
            $patente,
            $titular,
            $telefono,
            $email,
            $modelo,
            $servicio,
            $precio,
            $metodoPago,
            $estado,
            $notas
        ]) . "\r\n";

        // Escritura atómica con LOCK_EX en CSV
        $fp = @fopen($csvFile, 'a');
        if ($fp) {
            @flock($fp, LOCK_EX);
            @fwrite($fp, $csvLine);
            @flock($fp, LOCK_UN);
            @fclose($fp);
        }

        // Escritura atómica en JSONL para respaldo estructurado
        $jsonRecord = json_encode([
            'timestamp'     => $fechaHora,
            'tipo_registro' => $tipoRegistro,
            'numero_socio'  => $numeroSocio,
            'patente'       => $patente,
            'titular'       => $titular,
            'telefono'      => $telefono,
            'email'         => $email,
            'modelo'        => $modelo,
            'servicio'      => $servicio,
            'precio'        => $precio,
            'metodo_pago'   => $metodoPago,
            'estado'        => $estado,
            'notas'         => $notas
        ], JSON_UNESCAPED_UNICODE) . "\n";

        $fpJ = @fopen($jsonlFile, 'a');
        if ($fpJ) {
            @flock($fpJ, LOCK_EX);
            @fwrite($fpJ, $jsonRecord);
            @flock($fpJ, LOCK_UN);
            @fclose($fpJ);
        }

        return true;
    } catch (Exception $e) {
        error_log("Error en registrarClienteResguardoDonWeb: " . $e->getMessage());
        return false;
    }
}

// Endpoint HTTP si se accede directamente a api/backup_clientes.php
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    require_once __DIR__ . '/config.php';

    $action = $_GET['action'] ?? 'stats';

    if ($action === 'download') {
        if (isset($_GET['token']) && !isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $_GET['token'];
        }
        requireAuth(['admin', 'empleado']);
        $csvFile = __DIR__ . '/backups/clientes_resguardo.csv';
        if (!file_exists($csvFile)) {
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode(['error' => 'Aún no se han generado registros en el archivo de resguardo.'], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $filename = 'clientes_l1deres_backup_' . date('Y-m-d_His') . '.csv';
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($csvFile));
        readfile($csvFile);
        exit();
    }

    if ($action === 'stats') {
        header("Content-Type: application/json; charset=UTF-8");
        $csvFile = __DIR__ . '/backups/clientes_resguardo.csv';
        $exists = file_exists($csvFile);
        $size = $exists ? filesize($csvFile) : 0;
        $lines = 0;
        if ($exists) {
            $fp = fopen($csvFile, 'r');
            while (!feof($fp)) {
                if (fgets($fp) !== false) $lines++;
            }
            fclose($fp);
            if ($lines > 0) $lines--; // Descontar encabezado
        }
        echo json_encode([
            'success' => true,
            'archivo_existe' => $exists,
            'total_clientes_resguardados' => max(0, $lines),
            'tamano_bytes' => $size,
            'tamano_kb' => round($size / 1024, 2),
            'ultima_actualizacion' => $exists ? date('Y-m-d H:i:s', filemtime($csvFile)) : null
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
