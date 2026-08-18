<?php
// ============================================================
// ANNOUNCEMENTS & BENEFITS API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'announcements';
    if ($type === 'benefits') {
        $stmt = $pdo->query("SELECT * FROM `spinaz_benefits` WHERE `is_active` = 1 ORDER BY `created_at` DESC");
        sendResponse(['success' => true, 'benefits' => $stmt->fetchAll()]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `spinaz_announcements` WHERE `is_active` = 1 ORDER BY `created_at` DESC");
        sendResponse(['success' => true, 'announcements' => $stmt->fetchAll()]);
    }
}

if ($method === 'POST') {
    $input = getJsonInput();
    $id = $input['id'] ?? generateUuid();
    $type = $_GET['type'] ?? $input['type'] ?? 'announcement';

    if ($type === 'benefit') {
        $stmt = $pdo->prepare("
            INSERT INTO `spinaz_benefits` (`id`, `title`, `description`, `location`, `icon`, `color`)
            VALUES (:id, :t, :d, :l, :i, :c)
        ");
        $stmt->execute([
            ':id' => $id,
            ':t' => $input['title'] ?? '',
            ':d' => $input['description'] ?? '',
            ':l' => $input['location'] ?? null,
            ':i' => $input['icon'] ?? 'star',
            ':c' => $input['color'] ?? 'text-yellow-400'
        ]);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO `spinaz_announcements` (`id`, `title`, `content`)
            VALUES (:id, :t, :c)
        ");
        $stmt->execute([
            ':id' => $id,
            ':t' => $input['title'] ?? 'Aviso',
            ':c' => $input['content'] ?? ''
        ]);
    }

    sendResponse(['success' => true, 'id' => $id]);
}
