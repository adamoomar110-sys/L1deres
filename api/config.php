<?php
// ============================================================
// DONWEB MYSQL PDO CONNECTION & API CONFIGURATION (Aura v1.5)
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_name = 'a0170001_lava2';

$credentials = [
    ['user' => 'a0170001_lava2',   'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001_lava2',   'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001_l1deres', 'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001',         'pass' => '@Peloymago110Peloymago110']
];

$pdo = null;

foreach ($credentials as $cred) {
    try {
        $testPdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $cred['user'], $cred['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo = $testPdo;
        break;
    } catch (PDOException $e) {
        continue;
    }
}

function getJsonInput() {
    $input = file_get_contents("php://input");
    return json_decode($input, true) ?: [];
}

function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}
