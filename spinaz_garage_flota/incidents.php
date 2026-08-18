<?php
// ============================================================
// INCIDENTS API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM `spinaz_incidents` ORDER BY `created_at` DESC");
    $incidents = $stmt->fetchAll();
    sendResponse(['success' => true, 'incidents' => $incidents]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $id = $input['id'] ?? generateUuid();
    $driverId = $input['driver_id'] ?? null;
    $vehicleId = $input['vehicle_id'] ?? null;
    $description = trim($input['description'] ?? '');
    $photoUrl = $input['photo_url'] ?? null;
    $audioUrl = $input['audio_url'] ?? null;
    $status = $input['status'] ?? 'open';

    if (empty($description)) {
        sendResponse(['error' => 'La descripción es obligatoria'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_incidents` (`id`, `driver_id`, `vehicle_id`, `description`, `photo_url`, `audio_url`, `status`)
        VALUES (:id, :did, :vid, :desc, :purl, :aurl, :st)
        ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `description` = VALUES(`description`)
    ");
    $stmt->execute([
        ':id' => $id,
        ':did' => $driverId,
        ':vid' => $vehicleId,
        ':desc' => $description,
        ':purl' => $photoUrl,
        ':aurl' => $audioUrl,
        ':st' => $status
    ]);

    sendResponse(['success' => true, 'id' => $id]);
}
