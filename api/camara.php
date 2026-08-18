<?php
// ============================================================
// ENDPOINT CAMARA DE ESPERA EN VIVO (Aura v1.5 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uploadDir = __DIR__ . '/uploads';
$filePath = $uploadDir . '/camara_espera.jpg';
$metaPath = $uploadDir . '/camara_meta.json';

// Crear directorio de uploads si no existe
if (!file_exists($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if ($method === 'GET') {
    if (file_exists($filePath) && file_exists($metaPath)) {
        $meta = json_decode(file_get_contents($metaPath), true) ?: [];
        $mtime = filemtime($filePath);
        sendResponse([
            'success' => true,
            'image_url' => 'api/uploads/camara_espera.jpg?v=' . $mtime,
            'timestamp' => isset($meta['timestamp']) ? $meta['timestamp'] : date('Y-m-d H:i:s', $mtime),
            'age_seconds' => time() - $mtime,
            'has_camera' => true
        ]);
    } else {
        sendResponse([
            'success' => true,
            'image_url' => null,
            'timestamp' => null,
            'age_seconds' => 99999,
            'has_camera' => false
        ]);
    }
}

if ($method === 'POST') {
    $input = getJsonInput();
    $imageData = isset($input['image']) ? $input['image'] : null;

    if (!$imageData && isset($_POST['image'])) {
        $imageData = $_POST['image'];
    }

    if (!$imageData) {
        sendResponse(['error' => 'No se proporcionó imagen.'], 400);
    }

    // Decodificar Base64 Data URL
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
        $type = strtolower($type[1]);
        $data = base64_decode($imageData);

        if ($data === false) {
            sendResponse(['error' => 'Fallo al decodificar la imagen base64.'], 400);
        }
    } else {
        $data = base64_decode($imageData);
    }

    // Guardar archivo JPEG
    $saved = @file_put_contents($filePath, $data);
    if ($saved === false) {
        sendResponse(['error' => 'No se pudo guardar la foto en el servidor.'], 500);
    }

    $metaData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'size_bytes' => $saved,
        'client_ip' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'desconocida'
    ];
    @file_put_contents($metaPath, json_encode($metaData));

    sendResponse([
        'success' => true,
        'message' => 'Captura transmitida con éxito',
        'image_url' => 'api/uploads/camara_espera.jpg?v=' . time(),
        'timestamp' => $metaData['timestamp']
    ]);
}

sendResponse(['error' => 'Método no soportado'], 405);
