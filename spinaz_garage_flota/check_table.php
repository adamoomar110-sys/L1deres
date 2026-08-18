<?php
require_once __DIR__ . '/config.php';

try {
    $stmt = $pdo->query("DESCRIBE `spinaz_service_orders`");
    $columns = $stmt->fetchAll();
    echo json_encode(['columns' => $columns]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
