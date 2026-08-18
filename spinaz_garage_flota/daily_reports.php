<?php
// ============================================================
// DAILY REPORTS (KM & REVENUE) API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $driverId = $_GET['driver_id'] ?? '';
    if (!empty($driverId)) {
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_daily_reports` WHERE `driver_id` = :did ORDER BY `created_at` DESC");
        $stmt->execute([':did' => $driverId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `spinaz_daily_reports` ORDER BY `created_at` DESC");
    }
    $reports = $stmt->fetchAll();
    sendResponse(['success' => true, 'reports' => $reports]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $id = $input['id'] ?? generateUuid();
    $driverId = $input['driver_id'] ?? '';
    $vehicleId = $input['vehicle_id'] ?? null;
    $startKm = isset($input['start_km']) ? intval($input['start_km']) : 0;
    $endKm = isset($input['end_km']) ? intval($input['end_km']) : null;
    $revenue = isset($input['revenue']) ? floatval($input['revenue']) : 0.00;

    if (empty($driverId)) {
        sendResponse(['error' => 'ID de chofer es requerido'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_daily_reports` (`id`, `driver_id`, `vehicle_id`, `start_km`, `end_km`, `revenue`)
        VALUES (:id, :did, :vid, :skm, :ekm, :rev)
        ON DUPLICATE KEY UPDATE
            `end_km` = VALUES(`end_km`),
            `revenue` = VALUES(`revenue`),
            `end_time` = CURRENT_TIMESTAMP
    ");
    $stmt->execute([
        ':id' => $id,
        ':did' => $driverId,
        ':vid' => $vehicleId,
        ':skm' => $startKm,
        ':ekm' => $endKm,
        ':rev' => $revenue
    ]);

    sendResponse(['success' => true, 'id' => $id]);
}
