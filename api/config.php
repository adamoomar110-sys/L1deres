<?php
// ============================================================
// DONWEB MYSQL PDO CONNECTION & API CONFIGURATION (Aura v1.8)
// Base de datos oficial: a0170001_l1deres
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
$db_name = 'a0170001_l1deres';

// Cargar secrets externos (no versionados en Git)
$secretsFile = __DIR__ . '/secrets.php';
if (file_exists($secretsFile)) {
    require_once $secretsFile;
}

// OneSignal Push Notifications (fallback si secrets.php no existe)
if (!defined('ONESIGNAL_APP_ID'))  define('ONESIGNAL_APP_ID',  '263bf04a-ad7a-4d11-842d-210cea51387c');
if (!defined('ONESIGNAL_REST_KEY')) define('ONESIGNAL_REST_KEY', '');

$credentials = [
    ['user' => 'a0170001_l1deres', 'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001_l1deres', 'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001',         'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001',         'pass' => 'AuraFTP2025@aura']
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

// Si no conecta, $pdo queda null y los endpoints usan cache de contingencia

function getJsonInput() {
    $input = file_get_contents("php://input");
    return json_decode($input, true) ?: [];
}

function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}
