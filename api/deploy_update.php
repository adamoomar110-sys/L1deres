<?php
// ============================================================
// DEPLOY HELPER — L1DERES AUTOWASH
// Este script escribe archivos enviados en el request al disco.
// IMPORTANTE: Eliminar este archivo luego del deploy.
// ============================================================
$secret = 'L1DERES_DEPLOY_2025';

if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['file']) || !isset($input['content'])) {
    die(json_encode(['error' => 'Missing file or content']));
}

// Archivos permitidos (whitelist de seguridad)
$allowed = [
    'cliente/app.js'   => __DIR__ . '/../cliente/app.js',
    'script.js'        => __DIR__ . '/../script.js',
    'admin/script.js'  => __DIR__ . '/../admin/script.js',
];

$fileKey = $input['file'];
if (!isset($allowed[$fileKey])) {
    die(json_encode(['error' => 'File not allowed: ' . $fileKey]));
}

$targetPath = $allowed[$fileKey];
$content    = $input['content'];

$result = file_put_contents($targetPath, $content);
if ($result === false) {
    die(json_encode(['error' => 'Write failed', 'path' => $targetPath]));
}

echo json_encode(['success' => true, 'file' => $fileKey, 'bytes' => $result]);
