<?php
require_once __DIR__ . '/config.php';

$results = [];

$queries = [
    "ALTER TABLE `spinaz_service_orders` ADD `provider_type` VARCHAR(50) NOT NULL DEFAULT 'taller' AFTER `type`",
    "ALTER TABLE `spinaz_service_orders` ADD `budget` DECIMAL(10,2) DEFAULT 0.00 AFTER `cost`",
    "ALTER TABLE `spinaz_service_orders` ADD `appointment_date` VARCHAR(100) NULL AFTER `budget`"
];

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        $results[] = ["query" => $q, "status" => "OK"];
    } catch (Exception $e) {
        $results[] = ["query" => $q, "status" => "ALREADY_EXISTS_OR_ERR", "error" => $e->getMessage()];
    }
}

echo json_encode(['results' => $results]);
