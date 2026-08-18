<?php
// ============================================================
// ENDPOINT RESEÑAS Y OPINIONES (Aura v1.5 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!$pdo) {
        sendResponse([]);
    }

    try {
        $stmt = $pdo->query("SELECT `id`, `cliente_nombre`, `estrellas`, `estrellas` AS `rating`, `comentario`, `fecha` FROM `resenas` ORDER BY `id` DESC LIMIT 50");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    $input = getJsonInput();

    if (!$pdo) {
        sendResponse(['success' => true, 'id' => rand(1, 100)]);
    }

    try {
        $nombre      = isset($input['cliente_nombre']) ? trim($input['cliente_nombre']) : 'Cliente Anónimo';
        $estrellas   = isset($input['estrellas']) ? (int)$input['estrellas'] : (isset($input['rating']) ? (int)$input['rating'] : 5);
        $comentario  = isset($input['comentario']) ? trim($input['comentario']) : '';

        $stmt = $pdo->prepare("INSERT INTO `resenas` (`cliente_nombre`, `estrellas`, `comentario`) VALUES (:n, :e, :c)");
        $stmt->execute([
            ':n' => $nombre,
            ':e' => $estrellas,
            ':c' => $comentario
        ]);

        sendResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : null);

    if (!$pdo) {
        sendResponse(['success' => true]);
    }

    try {
        if ($id === 'all' || $id === 'ALL') {
            $pdo->exec("TRUNCATE TABLE `resenas`");
            sendResponse(['success' => true, 'message' => 'Todas las reseñas fueron eliminadas.']);
        } else if ($id && (int)$id > 0) {
            $stmt = $pdo->prepare("DELETE FROM `resenas` WHERE `id` = :id");
            $stmt->execute([':id' => (int)$id]);
            sendResponse(['success' => true, 'deleted_id' => (int)$id]);
        } else {
            // Si no especifican ID o viene vacio en DELETE, vaciar todas
            $pdo->exec("TRUNCATE TABLE `resenas`");
            sendResponse(['success' => true, 'message' => 'Todas las reseñas fueron eliminadas.']);
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Método no soportado'], 405);
