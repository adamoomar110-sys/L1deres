<?php
// ============================================================
// ENDPOINT CONVENIOS, SPONSORS Y ALIANZAS (Aura v1.8 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!$pdo) {
        sendResponse([]);
    }

    try {
        $stmt = $pdo->query("SELECT * FROM `sponsors` ORDER BY `orden` ASC, `id` ASC");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    requireAuth(['admin']);
    $input = getJsonInput();

    if (!$pdo) {
        sendResponse(['success' => true, 'id' => rand(1, 100)]);
    }

    try {
        $id          = isset($input['id']) ? (int)$input['id'] : 0;
        $nombre      = isset($input['nombre']) ? trim($input['nombre']) : 'Nuevo Convenio';
        $categoria   = isset($input['categoria']) ? trim($input['categoria']) : 'Convenio';
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';
        $logo_url    = isset($input['logo_url']) ? trim($input['logo_url']) : 'bx bx-star';
        $enlace      = isset($input['enlace']) ? trim($input['enlace']) : '#';
        $activo      = isset($input['activo']) ? (int)$input['activo'] : 1;
        $orden       = isset($input['orden']) ? (int)$input['orden'] : 1;

        if ($id > 0) {
            $stmt = $pdo->prepare("UPDATE `sponsors` SET `nombre` = :n, `categoria` = :c, `descripcion` = :d, `logo_url` = :l, `enlace` = :e, `activo` = :a, `orden` = :o WHERE `id` = :id");
            $stmt->execute([
                ':n' => $nombre,
                ':c' => $categoria,
                ':d' => $descripcion,
                ':l' => $logo_url,
                ':e' => $enlace,
                ':a' => $activo,
                ':o' => $orden,
                ':id' => $id
            ]);
            sendResponse(['success' => true, 'message' => 'Convenio actualizado']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO `sponsors` (`nombre`, `categoria`, `descripcion`, `logo_url`, `enlace`, `activo`, `orden`) VALUES (:n, :c, :d, :l, :e, :a, :o)");
            $stmt->execute([
                ':n' => $nombre,
                ':c' => $categoria,
                ':d' => $descripcion,
                ':l' => $logo_url,
                ':e' => $enlace,
                ':a' => $activo,
                ':o' => $orden
            ]);
            sendResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    requireAuth(['admin']);
    $input = getJsonInput();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($input['id']) ? (int)$input['id'] : 0);

    if (!$pdo) {
        sendResponse(['success' => true]);
    }

    try {
        if ($id > 0) {
            $stmt = $pdo->prepare("DELETE FROM `sponsors` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            sendResponse(['success' => true, 'deleted_id' => $id]);
        } else {
            sendResponse(['error' => 'ID inválido'], 400);
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Método no soportado'], 405);
