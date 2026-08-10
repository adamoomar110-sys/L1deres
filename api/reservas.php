<?php
// ============================================================
// ENDPOINT RESERVAS & TURNOS (Aura v1.5 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!$pdo) {
        sendResponse([]);
    }

    try {
        $patente = isset($_GET['patente']) ? trim($_GET['patente']) : '';
        $id      = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT * FROM `reservas` WHERE `id` = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $res = $stmt->fetch();
            sendResponse($res ?: []);
        } elseif (!empty($patente)) {
            $stmt = $pdo->prepare("SELECT * FROM `reservas` WHERE `patente` = :patente ORDER BY `id` DESC");
            $stmt->execute([':patente' => $patente]);
            sendResponse($stmt->fetchAll());
        } else {
            $stmt = $pdo->query("SELECT * FROM `reservas` ORDER BY `id` DESC LIMIT 200");
            sendResponse($stmt->fetchAll());
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    $input = getJsonInput();

    if (!$pdo) {
        sendResponse(['success' => true, 'id' => rand(100, 9999), 'input' => $input]);
    }

    try {
        $nombre   = isset($input['cliente_nombre']) ? trim($input['cliente_nombre']) : 'Cliente';
        $telefono = isset($input['cliente_telefono']) ? trim($input['cliente_telefono']) : '';
        $patente  = isset($input['patente']) ? strtoupper(trim($input['patente'])) : '';
        $modelo   = isset($input['modelo_auto']) ? trim($input['modelo_auto']) : 'Auto';
        $servicio = isset($input['tipo_servicio']) ? trim($input['tipo_servicio']) : 'Lavado';
        $precio   = isset($input['precio']) ? (float)$input['precio'] : 0.0;
        $estado   = isset($input['estado']) ? trim($input['estado']) : 'pendiente';
        $box_id   = isset($input['box_id']) ? (int)$input['box_id'] : 0;
        $fecha    = isset($input['fecha_reserva']) ? $input['fecha_reserva'] : date('Y-m-d');
        $hora     = isset($input['hora_reserva']) ? $input['hora_reserva'] : date('H:i:s');
        $notas    = isset($input['notas']) ? trim($input['notas']) : '';

        $stmt = $pdo->prepare("
            INSERT INTO `reservas` 
            (`cliente_nombre`, `cliente_telefono`, `patente`, `modelo_auto`, `tipo_servicio`, `precio`, `estado`, `box_id`, `fecha_reserva`, `hora_reserva`, `notas`)
            VALUES
            (:nombre, :telefono, :patente, :modelo, :servicio, :precio, :estado, :box_id, :fecha, :hora, :notas)
        ");

        $stmt->execute([
            ':nombre'   => $nombre,
            ':telefono' => $telefono,
            ':patente'  => $patente,
            ':modelo'   => $modelo,
            ':servicio' => $servicio,
            ':precio'   => $precio,
            ':estado'   => $estado,
            ':box_id'   => $box_id,
            ':fecha'    => $fecha,
            ':hora'     => $hora,
            ':notas'    => $notas
        ]);

        sendResponse([
            'success' => true,
            'id' => $pdo->lastInsertId()
        ]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' || $method === 'PATCH') {
    $input = getJsonInput();
    $id = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        sendResponse(['error' => 'ID de reserva requerido'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => true]);
    }

    try {
        $fields = [];
        $params = [':id' => $id];

        if (isset($input['estado'])) {
            $fields[] = "`estado` = :estado";
            $params[':estado'] = $input['estado'];
        }
        if (isset($input['box_id'])) {
            $fields[] = "`box_id` = :box_id";
            $params[':box_id'] = (int)$input['box_id'];
        }
        if (isset($input['notas'])) {
            $fields[] = "`notas` = :notas";
            $params[':notas'] = $input['notas'];
        }

        if (empty($fields)) {
            sendResponse(['success' => true, 'message' => 'Nada que actualizar']);
        }

        $sql = "UPDATE `reservas` SET " . implode(", ", $fields) . " WHERE `id` = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(['success' => true]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

    if ($id <= 0) {
        sendResponse(['error' => 'ID requerido'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => true]);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `reservas` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Método no permitido'], 405);
