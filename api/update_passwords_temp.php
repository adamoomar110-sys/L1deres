<?php
// Script temporal para actualizar contraseñas - BORRAR LUEGO DE USAR
require_once 'config.php';

if (!$pdo) {
    die(json_encode(['error' => 'No se pudo conectar a la DB']));
}

// Hash bcrypt de "25177943"
$newHash = password_hash('25177943', PASSWORD_BCRYPT);

$usuarios = [
    'claudia@l1deres.com',
    'javier@l1deres.com',
    'admin@aura.com',
    'empleado@aura.com'
];

$results = [];
foreach ($usuarios as $email) {
    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE email = ?");
    $ok = $stmt->execute([$newHash, $email]);
    $results[] = [
        'email' => $email,
        'updated' => $ok,
        'rows' => $stmt->rowCount()
    ];
}

echo json_encode([
    'status' => 'ok',
    'hash_used' => $newHash,
    'results' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
