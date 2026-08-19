<?php
// ============================================================
// PAYMENTS & DEBTS API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $driverId = $_GET['driver_id'] ?? '';
    $sql = "
        SELECT 
            p.*,
            pr.full_name as driver_name,
            pr.email as driver_email,
            pr.phone as driver_phone
        FROM `spinaz_payments` p
        LEFT JOIN `spinaz_profiles` pr ON p.driver_id = pr.id
    ";
    if (!empty($driverId)) {
        $sql .= " WHERE p.`driver_id` = :did ORDER BY p.`created_at` DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':did' => $driverId]);
    } else {
        $stmt = $pdo->query($sql . " ORDER BY p.`created_at` DESC");
    }
    $payments = $stmt->fetchAll();

    foreach ($payments as &$row) {
        $row['profiles'] = [
            'full_name' => $row['driver_name'] ?: 'Chofer sin nombre',
            'email' => $row['driver_email'] ?: 'Sin email'
        ];
    }

    sendResponse(['success' => true, 'payments' => $payments]);
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? generateUuid();
    $status = $input['status'] ?? null;

    // Si es solo una actualización de estado
    if (!empty($id) && $status !== null && (!isset($input['driver_id']) || empty($input['driver_id']))) {
        $stmt = $pdo->prepare("UPDATE `spinaz_payments` SET `status` = :st WHERE `id` = :id");
        $stmt->execute([':st' => $status, ':id' => $id]);
        sendResponse(['success' => true, 'id' => $id, 'status' => $status]);
    }

    $driverId = $input['driver_id'] ?? '';
    $amount = floatval($input['amount'] ?? 0);
    $type = $input['type'] ?? 'payment';
    $status = $status ?: 'pending';
    $dueDate = $input['due_date'] ?? null;
    $receiptUrl = $input['receipt_url'] ?? null;
    $notes = $input['notes'] ?? null;

    if (empty($driverId) || $amount <= 0) {
        sendResponse(['error' => 'Chofer y monto mayor a 0 requeridos'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_payments` (`id`, `driver_id`, `amount`, `type`, `status`, `due_date`, `receipt_url`, `notes`)
        VALUES (:id, :did, :amt, :type, :status, :ddate, :rurl, :notes)
        ON DUPLICATE KEY UPDATE
            `amount` = VALUES(`amount`),
            `type` = VALUES(`type`),
            `status` = VALUES(`status`),
            `due_date` = VALUES(`due_date`),
            `receipt_url` = VALUES(`receipt_url`),
            `notes` = VALUES(`notes`)
    ");
    $stmt->execute([
        ':id' => $id,
        ':did' => $driverId,
        ':amt' => $amount,
        ':type' => $type,
        ':status' => $status,
        ':ddate' => $dueDate,
        ':rurl' => $receiptUrl,
        ':notes' => $notes
    ]);

    sendResponse(['success' => true, 'id' => $id]);
}
