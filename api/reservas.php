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
            // El listado general de todas las reservas exige estar autenticado como admin o empleado
            requireAuth(['admin', 'empleado']);
            $stmt = $pdo->query("SELECT * FROM `reservas` ORDER BY `id` DESC LIMIT 200");
            sendResponse($stmt->fetchAll());
        }
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    $input = getJsonInput();
    $action = isset($input['action']) ? $input['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

    // Acciones administrativas de borrado vía POST
    if (in_array($action, ['clear_all', 'delete_history', 'delete'])) {
        requireAuth(['admin']);
        $id = isset($input['id']) ? $input['id'] : (isset($_GET['id']) ? $_GET['id'] : null);

        if ($action === 'clear_all' || $action === 'delete_history' || $id === 'all' || $id === 'ALL') {
            if ($pdo) {
                $pdo->exec("TRUNCATE TABLE `reservas`");
            }
            sendResponse(['success' => true, 'message' => 'Historial de reservas eliminado por completo']);
        }

        $idInt = (int)$id;
        if ($idInt <= 0) {
            sendResponse(['error' => 'ID requerido'], 400);
        }

        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM `reservas` WHERE `id` = :id");
            $stmt->execute([':id' => $idInt]);
        }
        sendResponse(['success' => true, 'deleted_id' => $idInt]);
    }

    if (!$pdo) {
        sendResponse(['success' => true, 'id' => rand(100, 9999), 'input' => $input]);
    }

    try {
        require_once __DIR__ . '/backup_clientes.php';

        $nombre   = isset($input['cliente_nombre']) ? trim($input['cliente_nombre']) : (isset($input['nombre_cliente']) ? trim($input['nombre_cliente']) : 'Cliente');
        $telefono = isset($input['cliente_telefono']) ? trim($input['cliente_telefono']) : (isset($input['telefono']) ? trim($input['telefono']) : '');
        $patente  = isset($input['patente']) ? strtoupper(trim($input['patente'])) : '';
        $modelo   = isset($input['modelo_auto']) ? trim($input['modelo_auto']) : (isset($input['tipo_vehiculo']) ? trim($input['tipo_vehiculo']) : 'Auto');
        $servicio = isset($input['tipo_servicio']) ? trim($input['tipo_servicio']) : (isset($input['tipo_lavado']) ? trim($input['tipo_lavado']) : 'Lavado');
        $precio   = isset($input['precio']) ? (float)$input['precio'] : 0.0;
        $estado   = isset($input['estado']) ? trim($input['estado']) : 'pendiente';
        $box_id   = isset($input['box_id']) ? (int)$input['box_id'] : 0;
        $fecha    = isset($input['fecha_reserva']) ? $input['fecha_reserva'] : (isset($input['fecha']) ? $input['fecha'] : date('Y-m-d'));
        $hora     = isset($input['hora_reserva']) ? $input['hora_reserva'] : (isset($input['hora']) ? $input['hora'] : date('H:i:s'));
        $notas    = isset($input['notas']) ? trim($input['notas']) : '';
        $metodo   = isset($input['metodo_pago']) ? trim($input['metodo_pago']) : (isset($input['metodo']) ? trim($input['metodo']) : 'efectivo');

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

        $lastId = $pdo->lastInsertId();

        // Resguardo físico inmutable automático en DonWeb (.csv y .jsonl)
        registrarClienteResguardoDonWeb([
            'tipo_registro'  => 'CLIENTE_PISTA_O_RESERVA',
            'patente'        => $patente,
            'titular'        => $nombre,
            'telefono'       => $telefono,
            'modelo'         => $modelo,
            'servicio'       => $servicio,
            'precio'         => $precio,
            'metodo_pago'    => $metodo,
            'estado'         => $estado,
            'notas'          => $notas
        ]);

        sendResponse([
            'success' => true,
            'id' => $lastId
        ]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' || $method === 'PATCH') {
    requireAuth(['admin', 'empleado']);
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
    requireAuth(['admin']);
    $id = isset($input['id']) ? $input['id'] : (isset($_GET['id']) ? $_GET['id'] : null);
    $action = isset($input['action']) ? $input['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

    // Limpiar todo el historial
    if ($id === 'all' || $action === 'clear_all' || $action === 'delete_history') {
        if ($pdo) {
            $pdo->exec("TRUNCATE TABLE `reservas`");
        }
        sendResponse(['success' => true, 'message' => 'Historial de reservas eliminado por completo']);
    }

    $idInt = (int)$id;
    if ($idInt <= 0) {
        sendResponse(['error' => 'ID requerido'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => true]);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `reservas` WHERE `id` = :id");
        $stmt->execute([':id' => $idInt]);
        sendResponse(['success' => true, 'deleted_id' => $idInt]);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Método no permitido'], 405);
