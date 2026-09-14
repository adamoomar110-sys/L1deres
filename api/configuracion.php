<?php
// ============================================================
// ENDPOINT CONFIGURACION & LIVE STATE (Aura v1.8 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$liveJsonPath = __DIR__ . '/live_state.json';

// Helper para leer cache local de live_state
function getLocalLiveState($path) {
    if (file_exists($path)) {
        $content = @file_get_contents($path);
        if ($content) {
            $json = json_decode($content, true);
            if ($json !== null) return $json;
        }
    }
    return null;
}

// Helper para guardar cache local de live_state
function saveLocalLiveState($path, $state) {
    try {
        if (is_array($state)) {
            $content = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            $content = $state;
        }
        @file_put_contents($path, $content, LOCK_EX);
    } catch (Exception $e) {}
}

// Auto-migración: asegurar que existan las columnas tiempo_lavado y tiempo_secado
if ($pdo) {
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM `configuracion` LIKE 'tiempo_lavado'")->fetchAll();
        if (empty($cols)) {
            $pdo->exec("ALTER TABLE `configuracion` ADD COLUMN `tiempo_lavado` INT DEFAULT 120000 AFTER `live_state`");
        }
        $cols2 = $pdo->query("SHOW COLUMNS FROM `configuracion` LIKE 'tiempo_secado'")->fetchAll();
        if (empty($cols2)) {
            $pdo->exec("ALTER TABLE `configuracion` ADD COLUMN `tiempo_secado` INT DEFAULT 180000 AFTER `tiempo_lavado`");
        }
    } catch (Exception $e) {}
}

if ($method === 'GET') {
    $cachedLive = getLocalLiveState($liveJsonPath);

    $defaultRow = [
        'id' => 1,
        'tiempo_lavado' => 120000,
        'tiempo_secado' => 180000,
        'lavado_min' => 2,
        'lavado_sec' => 0,
        'secado_min' => 3,
        'secado_sec' => 0,
        'precio_express_auto' => 10000,
        'precio_express_camioneta' => 12000,
        'precio_completo_auto' => 15000,
        'precio_completo_camioneta' => 18000,
        'whatsapp_number' => '5491160473754',
        'dias_atencion' => 'Lunes a Sábados',
        'hora_apertura' => '08:00',
        'hora_cierre' => '20:00',
        'atiende_domingos' => 0,
        'atiende_feriados' => 0,
        'mensaje_feriados' => '',
        'live_state' => $cachedLive
    ];

    if (!$pdo) {
        sendResponse($defaultRow);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM `configuracion` WHERE `id` = 1 LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row) {
            $row = $defaultRow;
        } else {
            if (isset($row['live_state']) && is_string($row['live_state'])) {
                $decoded = json_decode($row['live_state'], true);
                if ($decoded !== null) {
                    $row['live_state'] = $decoded;
                }
            }
            if (empty($row['live_state']) && $cachedLive) {
                $row['live_state'] = $cachedLive;
            }
        }

        // Normalizar y calcular campos de tiempo
        $row['tiempo_lavado'] = (isset($row['tiempo_lavado']) && (int)$row['tiempo_lavado'] > 0) ? (int)$row['tiempo_lavado'] : 120000;
        $row['tiempo_secado'] = (isset($row['tiempo_secado']) && (int)$row['tiempo_secado'] > 0) ? (int)$row['tiempo_secado'] : 180000;
        $row['lavado_min'] = (int)floor($row['tiempo_lavado'] / 60000);
        $row['lavado_sec'] = (int)floor(($row['tiempo_lavado'] % 60000) / 1000);
        $row['secado_min'] = (int)floor($row['tiempo_secado'] / 60000);
        $row['secado_sec'] = (int)floor(($row['tiempo_secado'] % 60000) / 1000);

        sendResponse($row);
    } catch (Exception $e) {
        sendResponse($defaultRow);
    }
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();

    // Guardar siempre en cache JSON para máxima resiliencia inmediata
    if (isset($input['live_state'])) {
        saveLocalLiveState($liveJsonPath, $input['live_state']);
    }

    // Consultar configuración actual
    $current = [
        'tiempo_lavado' => 120000,
        'tiempo_secado' => 180000,
        'precio_express_auto' => 10000,
        'precio_express_camioneta' => 12000,
        'precio_completo_auto' => 15000,
        'precio_completo_camioneta' => 18000,
        'whatsapp_number' => '5491160473754',
        'dias_atencion' => 'Lunes a Sábados',
        'hora_apertura' => '08:00',
        'hora_cierre' => '20:00',
        'atiende_domingos' => 0,
        'atiende_feriados' => 0,
        'mensaje_feriados' => '',
        'live_state' => null
    ];

    if ($pdo) {
        try {
            $stmtSelect = $pdo->prepare("SELECT * FROM `configuracion` WHERE `id` = 1 LIMIT 1");
            $stmtSelect->execute();
            $fetched = $stmtSelect->fetch();
            if ($fetched) $current = array_merge($current, $fetched);
        } catch (Exception $e) {}
    }

    // Procesar tiempo de lavado
    $tLavado = null;
    if (isset($input['tiempo_lavado'])) {
        $tLavado = (int)$input['tiempo_lavado'];
    } elseif (isset($input['lavado_min']) || isset($input['lavado_sec'])) {
        $lM = isset($input['lavado_min']) ? (int)$input['lavado_min'] : 0;
        $lS = isset($input['lavado_sec']) ? (int)$input['lavado_sec'] : 0;
        $tLavado = (($lM * 60) + $lS) * 1000;
    }
    if ($tLavado === null && isset($current['tiempo_lavado'])) {
        $tLavado = (int)$current['tiempo_lavado'];
    }
    if (!$tLavado || $tLavado <= 0) $tLavado = 120000;

    // Procesar tiempo de secado
    $tSecado = null;
    if (isset($input['tiempo_secado'])) {
        $tSecado = (int)$input['tiempo_secado'];
    } elseif (isset($input['secado_min']) || isset($input['secado_sec'])) {
        $sM = isset($input['secado_min']) ? (int)$input['secado_min'] : 0;
        $sS = isset($input['secado_sec']) ? (int)$input['secado_sec'] : 0;
        $tSecado = (($sM * 60) + $sS) * 1000;
    }
    if ($tSecado === null && isset($current['tiempo_secado'])) {
        $tSecado = (int)$current['tiempo_secado'];
    }
    if (!$tSecado || $tSecado <= 0) $tSecado = 180000;

    $liveState = isset($input['live_state']) 
        ? (is_array($input['live_state']) ? json_encode($input['live_state'], JSON_UNESCAPED_UNICODE) : $input['live_state']) 
        : (is_array($current['live_state']) ? json_encode($current['live_state']) : $current['live_state']);

    // Actualizar tiempos en cache JSON de live_state
    $cachedLive = getLocalLiveState($liveJsonPath);
    if ($cachedLive && is_array($cachedLive)) {
        $cachedLive['tiempo_lavado_ms'] = $tLavado;
        $cachedLive['tiempo_secado_ms'] = $tSecado;
        saveLocalLiveState($liveJsonPath, $cachedLive);
    }

    $pExpAuto = isset($input['precio_express_auto']) ? (int)$input['precio_express_auto'] : (int)$current['precio_express_auto'];
    $pExpCam = isset($input['precio_express_camioneta']) ? (int)$input['precio_express_camioneta'] : (int)$current['precio_express_camioneta'];
    $pCompAuto = isset($input['precio_completo_auto']) ? (int)$input['precio_completo_auto'] : (int)$current['precio_completo_auto'];
    $pCompCam = isset($input['precio_completo_camioneta']) ? (int)$input['precio_completo_camioneta'] : (int)$current['precio_completo_camioneta'];

    $waNumber = isset($input['whatsapp_number']) ? $input['whatsapp_number'] : $current['whatsapp_number'];
    $dias     = isset($input['dias_atencion'])   ? $input['dias_atencion']   : $current['dias_atencion'];
    $apert    = isset($input['hora_apertura'])   ? $input['hora_apertura']   : $current['hora_apertura'];
    $cierre   = isset($input['hora_cierre'])     ? $input['hora_cierre']     : $current['hora_cierre'];

    $domingos = isset($input['atiende_domingos']) ? ($input['atiende_domingos'] ? 1 : 0) : $current['atiende_domingos'];
    $feriados = isset($input['atiende_feriados']) ? ($input['atiende_feriados'] ? 1 : 0) : $current['atiende_feriados'];
    $msgFer   = isset($input['mensaje_feriados']) ? $input['mensaje_feriados'] : $current['mensaje_feriados'];

    if (!$pdo) {
        sendResponse([
            'success' => true,
            'updated' => $input,
            'tiempo_lavado' => $tLavado,
            'tiempo_secado' => $tSecado,
            'note' => 'Cache local JSON'
        ]);
    }

    try {
        $stmtSave = $pdo->prepare("
            INSERT INTO `configuracion` 
            (`id`, `live_state`, `tiempo_lavado`, `tiempo_secado`, `precio_express_auto`, `precio_express_camioneta`, `precio_completo_auto`, `precio_completo_camioneta`, `whatsapp_number`, `dias_atencion`, `hora_apertura`, `hora_cierre`, `atiende_domingos`, `atiende_feriados`, `mensaje_feriados`)
            VALUES (1, :live_state, :t_lav, :t_sec, :p1, :p2, :p3, :p4, :wa, :dias, :aper, :cier, :dom, :fer, :msg)
            ON DUPLICATE KEY UPDATE
            `live_state` = VALUES(`live_state`),
            `tiempo_lavado` = VALUES(`tiempo_lavado`),
            `tiempo_secado` = VALUES(`tiempo_secado`),
            `precio_express_auto` = VALUES(`precio_express_auto`),
            `precio_express_camioneta` = VALUES(`precio_express_camioneta`),
            `precio_completo_auto` = VALUES(`precio_completo_auto`),
            `precio_completo_camioneta` = VALUES(`precio_completo_camioneta`),
            `whatsapp_number` = VALUES(`whatsapp_number`),
            `dias_atencion` = VALUES(`dias_atencion`),
            `hora_apertura` = VALUES(`hora_apertura`),
            `hora_cierre` = VALUES(`hora_cierre`),
            `atiende_domingos` = VALUES(`atiende_domingos`),
            `atiende_feriados` = VALUES(`atiende_feriados`),
            `mensaje_feriados` = VALUES(`mensaje_feriados`)
        ");

        $stmtSave->execute([
            ':live_state' => $liveState,
            ':t_lav' => $tLavado,
            ':t_sec' => $tSecado,
            ':p1' => $pExpAuto,
            ':p2' => $pExpCam,
            ':p3' => $pCompAuto,
            ':p4' => $pCompCam,
            ':wa' => $waNumber,
            ':dias' => $dias,
            ':aper' => $apert,
            ':cier' => $cierre,
            ':dom'  => $domingos,
            ':fer'  => $feriados,
            ':msg'  => $msgFer
        ]);

        sendResponse([
            'success' => true,
            'tiempo_lavado' => $tLavado,
            'tiempo_secado' => $tSecado,
            'lavado_min' => (int)floor($tLavado / 60000),
            'lavado_sec' => (int)floor(($tLavado % 60000) / 1000),
            'secado_min' => (int)floor($tSecado / 60000),
            'secado_sec' => (int)floor(($tSecado % 60000) / 1000)
        ]);
    } catch (Exception $e) {
        sendResponse([
            'success' => true,
            'tiempo_lavado' => $tLavado,
            'tiempo_secado' => $tSecado,
            'note' => 'Guardado en cache JSON: ' . $e->getMessage()
        ]);
    }
}

sendResponse(['error' => 'Método no soportado'], 405);
