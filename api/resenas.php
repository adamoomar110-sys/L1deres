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

    // Soporte para acciones administrativas vía POST (por si el servidor/proxy filtra DELETE)
    if (isset($input['action']) && in_array($input['action'], ['delete', 'delete_all', 'clear_all'])) {
        requireAuth(['admin']);
        $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : null);
        if ($input['action'] === 'delete_all' || $input['action'] === 'clear_all' || $id === 'all' || $id === 'ALL') {
            if ($pdo) {
                $pdo->exec("TRUNCATE TABLE `resenas`");
            }
            sendResponse(['success' => true, 'message' => 'Todas las reseñas fueron eliminadas correctamente.']);
        }

        $idInt = (int)$id;
        if ($idInt <= 0) {
            sendResponse(['error' => 'ID de reseña requerido para eliminar.'], 400);
        }

        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM `resenas` WHERE `id` = :id");
            $stmt->execute([':id' => $idInt]);
        }
        sendResponse(['success' => true, 'deleted_id' => $idInt]);
    }

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
    requireAuth(['admin']);
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
            sendResponse(['error' => 'ID de reseña requerido para eliminar.'], 400);
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Método no soportado'], 405);
