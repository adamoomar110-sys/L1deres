<?php
// ============================================================
// ENDPOINT NOTIFICACIONES PUSH ONESIGNAL (Aura v1.6 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = getJsonInput();
    $action = isset($input['action']) ? $input['action'] : 'send_push';

    // ----------------------------------------------------
    // ACCIÓN: ENVIAR NOTIFICACIÓN PUSH ONESIGNAL
    // ----------------------------------------------------
    if ($action === 'send_push') {
        $titulo  = isset($input['titulo']) ? trim($input['titulo']) : 'Aura AutoWash';
        $mensaje = isset($input['mensaje']) ? trim($input['mensaje']) : '';
        $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
        $url     = isset($input['url']) ? trim($input['url']) : 'https://l1deres.site/cliente/';

        if (empty($mensaje)) {
            sendResponse(['error' => 'El mensaje de la notificación es obligatorio'], 400);
        }

        // Obtener credenciales de OneSignal guardadas en DB o valores por defecto
        $appId = '263bf04a-ad7a-4d11-842d-210cea51387c';
        $restKey = '263bf04a-ad7a-4d11-842d-210cea51387c';

        if ($pdo) {
            try {
                $stmt = $pdo->query("SELECT live_state FROM configuracion WHERE id = 1 LIMIT 1");
                $cfgRow = $stmt->fetch();
                if ($cfgRow && !empty($cfgRow['live_state'])) {
                    $state = json_decode($cfgRow['live_state'], true);
                    if (!empty($state['onesignal_app_id'])) $appId = $state['onesignal_app_id'];
                    if (!empty($state['onesignal_rest_key'])) $restKey = $state['onesignal_rest_key'];
                }
            } catch (Exception $ex) {}
        }

        // Estructura de notificación OneSignal
        $fields = [
            'app_id' => $appId,
            'headings' => ['es' => $titulo, 'en' => $titulo],
            'contents' => ['es' => $mensaje, 'en' => $mensaje],
            'url' => $url
        ];

        if (!empty($telefono)) {
            $fields['filters'] = [
                ['field' => 'tag', 'key' => 'telefono', 'relation' => '=', 'value' => $telefono]
            ];
        } else {
            $fields['included_segments'] = ['Subscribed Users'];
        }

        // Realizar cURL a OneSignal REST API
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://onesignal.com/api/v1/notifications");
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json; charset=utf-8',
            'Authorization: Basic ' . $restKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        sendResponse([
            'success' => true,
            'message' => 'Notificación procesada',
            'http_code' => $httpCode,
            'onesignal_response' => json_decode($response, true)
        ]);
    }

    // ----------------------------------------------------
    // ACCIÓN: GUARDAR CONFIGURACIÓN ONESIGNAL
    // ----------------------------------------------------
    if ($action === 'save_onesignal_config') {
        $appId = isset($input['app_id']) ? trim($input['app_id']) : '';
        $restKey = isset($input['rest_key']) ? trim($input['rest_key']) : '';

        if ($pdo) {
            try {
                $stmt = $pdo->query("SELECT live_state FROM configuracion WHERE id = 1 LIMIT 1");
                $row = $stmt->fetch();
                $state = ($row && !empty($row['live_state'])) ? json_decode($row['live_state'], true) : [];
                
                $state['onesignal_app_id'] = $appId;
                $state['onesignal_rest_key'] = $restKey;

                $updateStmt = $pdo->prepare("UPDATE configuracion SET live_state = :state WHERE id = 1");
                $updateStmt->execute([':state' => json_encode($state)]);

                sendResponse(['success' => true, 'message' => 'Configuración de OneSignal guardada en MySQL']);
            } catch (Exception $e) {
                sendResponse(['error' => $e->getMessage()], 500);
            }
        }

        sendResponse(['success' => true, 'message' => 'Configuración guardada localmente']);
    }
}

if ($method === 'GET') {
    $appId = '';
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT live_state FROM configuracion WHERE id = 1 LIMIT 1");
            $row = $stmt->fetch();
            if ($row && !empty($row['live_state'])) {
                $state = json_decode($row['live_state'], true);
                if (!empty($state['onesignal_app_id'])) $appId = $state['onesignal_app_id'];
            }
        } catch (Exception $e) {}
    }
    sendResponse(['status' => 'push_endpoint_ready', 'onesignal_app_id' => $appId]);
}

sendResponse(['error' => 'Método no soportado'], 405);
