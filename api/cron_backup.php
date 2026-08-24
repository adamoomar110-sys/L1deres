<?php
// ============================================================
// SCRIPT DE BACKUP AUTOMÁTICO PARA DONWEB (Aura Startup)
// Guarda respaldos de MySQL en directorio privado storagedir
// ============================================================
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$db_name = 'a0170001_l1deres';

$credentials = [
    ['user' => 'a0170001_l1deres', 'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001_l1deres', 'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001_lava2',   'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001',         'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001',         'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001_lava2',   'pass' => 'AuraFTP2025@aura']
];

$pdo = null;

foreach ($credentials as $cred) {
    try {
        $testPdo = new PDO("mysql:host={$host};dbname={$db_name};charset=utf8mb4", $cred['user'], $cred['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $pdo = $testPdo;
        break;
    } catch (PDOException $ex) {
        continue;
    }
}

if (!$pdo) {
    echo json_encode(['success' => false, 'error' => 'No se pudo conectar a la base de datos de DonWeb.'], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    // Definir directorio privado de backups (fuera de public_html si es posible, o en storagedir)
    $backupDir = __DIR__ . '/../../storagedir/backups';
    if (!file_exists($backupDir)) {
        @mkdir($backupDir, 0755, true);
    }
    if (!file_exists($backupDir)) {
        $backupDir = __DIR__ . '/backups';
        if (!file_exists($backupDir)) {
            @mkdir($backupDir, 0755, true);
        }
    }

    // Obtener lista de tablas
    $tablesStmt = $pdo->query("SHOW TABLES");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    $backupData = [
        'generated_at' => date('Y-m-d H:i:s'),
        'database' => $db_name,
        'tables' => []
    ];

    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT * FROM `{$table}`");
        $rows = $stmt->fetchAll();
        $backupData['tables'][$table] = [
            'count' => count($rows),
            'rows' => $rows
        ];
    }

    $dateStr = date('Y-m-d_H-i-s');
    $filename = "backup_donweb_{$dateStr}.json";
    $filepath = $backupDir . '/' . $filename;

    $jsonContent = json_encode($backupData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    file_put_contents($filepath, $jsonContent);

    // Rotación de backups (mantener solo los últimos 14 archivos)
    $files = glob($backupDir . '/backup_donweb_*.json');
    if (count($files) > 14) {
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        while (count($files) > 14) {
            $oldest = array_shift($files);
            @unlink($oldest);
        }
    }

    $fileSizeBytes = filesize($filepath);

    echo json_encode([
        'success' => true,
        'message' => 'Backup generado con éxito en DonWeb.',
        'filename' => $filename,
        'size_bytes' => $fileSizeBytes,
        'size_mb' => round($fileSizeBytes / (1024 * 1024), 2),
        'tables_backed_up' => array_keys($backupData['tables']),
        'total_backups_stored' => count(glob($backupDir . '/backup_donweb_*.json'))
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
