<?php
// ============================================================
// PAYMENTS & DEBTS API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $driverId = $_GET['driver_id'] ?? '';
    if (!empty($driverId)) {
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_payments` WHERE `driver_id` = :did ORDER BY `created_at` DESC");
        $stmt->execute([':did' => $driverId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `spinaz_payments` ORDER BY `created_at` DESC");
    }
    $payments = $stmt->fetchAll();
    sendResponse(['success' => true, 'payments' => $payments]);
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? generateUuid();
    $driverId = $input['driver_id'] ?? '';
    $amount = floatval($input['amount'] ?? 0);
    $type = $input['type'] ?? 'payment';
    $status = $input['status'] ?? 'pending';
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
