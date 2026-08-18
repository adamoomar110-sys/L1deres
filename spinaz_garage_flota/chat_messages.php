<?php
// ============================================================
// CHAT MESSAGES API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Asegurar que la tabla exista
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `spinaz_chat_messages` (
      `id` VARCHAR(64) PRIMARY KEY,
      `channel` VARCHAR(50) NOT NULL,
      `sender` VARCHAR(50) NOT NULL,
      `message` TEXT NOT NULL,
      `is_read` TINYINT(1) DEFAULT 0,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

if ($method === 'GET') {
    $channel = $_GET['channel'] ?? '';
    $action = $_GET['action'] ?? '';
    $limit = intval($_GET['limit'] ?? 100);
    if ($limit <= 0 || $limit > 500) $limit = 100;

    // Conteo de mensajes no leídos
    if ($action === 'unread_count') {
        $sender = $_GET['not_sender'] ?? '';
        $sql = "SELECT COUNT(*) as unread FROM `spinaz_chat_messages` WHERE `is_read` = 0";
        $params = [];
        if (!empty($channel)) {
            $sql .= " AND `channel` = :ch";
            $params[':ch'] = $channel;
        }
        if (!empty($sender)) {
            $sql .= " AND `sender` != :s";
            $params[':s'] = $sender;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $res = $stmt->fetch();
        sendResponse(['success' => true, 'unread' => intval($res['unread'] ?? 0)]);
    }

    $sql = "SELECT * FROM `spinaz_chat_messages` WHERE 1=1";
    $params = [];

    if (!empty($channel)) {
        $sql .= " AND `channel` = :ch";
        $params[':ch'] = $channel;
    }

    $sql .= " ORDER BY `created_at` ASC LIMIT " . $limit;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $messages = $stmt->fetchAll();

    sendResponse([
        'success' => true, 
        'messages' => $messages, 
        'chat_messages' => $messages
    ]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $action = $_GET['action'] ?? $input['action'] ?? '';

    // Marcar como leídos
    if ($action === 'mark_read') {
        $channel = $input['channel'] ?? $_GET['channel'] ?? '';
        $notSender = $input['not_sender'] ?? $_GET['not_sender'] ?? '';
        if (!empty($channel)) {
            $sql = "UPDATE `spinaz_chat_messages` SET `is_read` = 1 WHERE `channel` = :ch";
            $params = [':ch' => $channel];
            if (!empty($notSender)) {
                $sql .= " AND `sender` != :ns";
                $params[':ns'] = $notSender;
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            sendResponse(['success' => true, 'marked' => true]);
        }
    }

    $id = $input['id'] ?? generateUuid();
    $channel = trim($input['channel'] ?? 'TALLER');
    $sender = trim($input['sender'] ?? 'ADMIN');
    $message = trim($input['message'] ?? '');

    if (empty($message)) {
        sendResponse(['error' => 'El mensaje no puede estar vacío'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_chat_messages` (`id`, `channel`, `sender`, `message`, `is_read`, `created_at`)
        VALUES (:id, :ch, :s, :m, 0, NOW())
    ");
    $stmt->execute([
        ':id' => $id,
        ':ch' => $channel,
        ':s' => $sender,
        ':m' => $message
    ]);

    $newMessage = [
        'id' => $id,
        'channel' => $channel,
        'sender' => $sender,
        'message' => $message,
        'is_read' => 0,
        'created_at' => date('Y-m-d H:i:s')
    ];

    sendResponse([
        'success' => true, 
        'id' => $id, 
        'message' => $newMessage,
        'chat_messages' => [$newMessage]
    ]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (!empty($id)) {
        $stmt = $pdo->prepare("DELETE FROM `spinaz_chat_messages` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true]);
    }
    sendResponse(['error' => 'ID requerido para eliminar'], 400);
}

sendResponse(['error' => 'Acción no soportada'], 400);
