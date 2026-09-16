<?php
// ============================================================
// DONWEB MYSQL PDO CONNECTION & API CONFIGURATION (Aura v1.8)
// Base de datos oficial: a0170001_l1deres
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Authorization, token");
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

// Zona horaria oficial unificada de Argentina
date_default_timezone_set('America/Argentina/Buenos_Aires');

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
        try {
            $pdo->exec("SET time_zone = '-03:00'");
        } catch (Exception $tzEx) {}
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

/**
 * Obtener usuario autenticado desde cabeceras HTTP, FastCGI, JSON o query
 */
function getAuthUser() {
    $rawToken = '';

    // 1. Cabeceras HTTP vía getallheaders
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach (['Authorization', 'authorization', 'X-Auth-Token', 'x-auth-token', 'X-Authorization', 'x-authorization'] as $hKey) {
            if (!empty($headers[$hKey])) {
                $rawToken = $headers[$hKey];
                break;
            }
        }
    }

    // 2. Variables de servidor ($_SERVER)
    if (empty($rawToken)) {
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION', 'HTTP_X_AUTHORIZATION', 'HTTP_X_AUTH_TOKEN', 'HTTP_X_TOKEN'] as $sKey) {
            if (!empty($_SERVER[$sKey])) {
                $rawToken = $_SERVER[$sKey];
                break;
            }
        }
    }

    // 3. Parámetro en Query o POST
    if (empty($rawToken)) {
        if (!empty($_GET['token'])) $rawToken = $_GET['token'];
        elseif (!empty($_GET['auth_token'])) $rawToken = $_GET['auth_token'];
        elseif (!empty($_POST['token'])) $rawToken = $_POST['token'];
    }

    // 4. Parámetro en cuerpo JSON
    if (empty($rawToken)) {
        $json = getJsonInput();
        if (!empty($json['token'])) $rawToken = $json['token'];
        elseif (!empty($json['auth_token'])) $rawToken = $json['auth_token'];
    }

    if (empty($rawToken)) return null;

    if (preg_match('/Bearer\s+(.*)$/i', $rawToken, $matches)) {
        $rawToken = trim($matches[1]);
    }

    $decoded = json_decode(base64_decode($rawToken), true);
    if ($decoded && is_array($decoded) && (!empty($decoded['email']) || !empty($decoded['id']) || !empty($decoded['role']))) {
        return $decoded;
    }
    return null;
}

/**
 * Exigir autenticacion con roles permitidos
 */
function requireAuth($allowedRoles = ['admin', 'empleado']) {
    $user = getAuthUser();
    if (!$user) {
        sendResponse(['error' => 'No autorizado. Inicie sesión para continuar.'], 401);
    }
    if (!empty($allowedRoles)) {
        $role = strtolower(trim($user['role'] ?? 'empleado'));
        $valid = false;
        foreach ($allowedRoles as $allowed) {
            if (strtolower($allowed) === $role) {
                $valid = true;
                break;
            }
        }
        if (!$valid) {
            sendResponse(['error' => 'Acceso denegado. Permisos insuficientes.'], 403);
        }
    }
    return $user;
}

/**
 * Limpiar claves sensibles de live_state para consumo publico
 */
function sanitizeLiveState($state) {
    if (empty($state)) return $state;
    $isJsonString = is_string($state);
    $data = $isJsonString ? json_decode($state, true) : $state;
    if (is_array($data)) {
        unset($data['onesignal_rest_key']);
        unset($data['rest_key']);
        unset($data['db_pass']);
    }
    return $isJsonString ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
}
