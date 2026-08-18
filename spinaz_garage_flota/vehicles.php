<?php
// ============================================================
// VEHICLES API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? '';
    $plate = $_GET['plate'] ?? '';
    $status = $_GET['status'] ?? '';

    if (!empty($id)) {
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_vehicles` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $vehicle = $stmt->fetch();
        if ($vehicle) {
            $vehicle['metrics'] = json_decode($vehicle['metrics'] ?? '{}', true);
        }
        sendResponse(['success' => true, 'vehicle' => $vehicle]);
    } elseif (!empty($plate)) {
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_vehicles` WHERE `plate` = :p LIMIT 1");
        $stmt->execute([':p' => strtoupper(trim($plate))]);
        $vehicle = $stmt->fetch();
        if ($vehicle) {
            $vehicle['metrics'] = json_decode($vehicle['metrics'] ?? '{}', true);
        }
        sendResponse(['success' => true, 'vehicle' => $vehicle]);
    } else {
        $sql = "SELECT * FROM `spinaz_vehicles`";
        $params = [];
        if (!empty($status)) {
            $sql .= " WHERE `status` = :st";
            $params[':st'] = $status;
        }
        $sql .= " ORDER BY `created_at` DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $vehicles = $stmt->fetchAll();
        foreach ($vehicles as &$v) {
            $v['metrics'] = json_decode($v['metrics'] ?? '{}', true);
        }
        sendResponse(['success' => true, 'vehicles' => $vehicles]);
    }
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? $_GET['id'] ?? '';
    $plate = isset($input['plate']) ? strtoupper(trim($input['plate'])) : '';

    // Buscar si ya existe el vehículo por ID o por patente
    $existing = null;
    if (!empty($id)) {
        $stmtCheck = $pdo->prepare("SELECT * FROM `spinaz_vehicles` WHERE `id` = :id LIMIT 1");
        $stmtCheck->execute([':id' => $id]);
        $existing = $stmtCheck->fetch();
    }
    if (!$existing && !empty($plate)) {
        $stmtCheck = $pdo->prepare("SELECT * FROM `spinaz_vehicles` WHERE `plate` = :plate LIMIT 1");
        $stmtCheck->execute([':plate' => $plate]);
        $existing = $stmtCheck->fetch();
    }

    // CASO 1: Actualización de vehículo existente (soporta actualización parcial: status, metrics, etc.)
    if ($existing) {
        $targetId = $existing['id'];
        $fields = [];
        $params = [':id' => $targetId];

        if (!empty($plate) && $plate !== $existing['plate']) {
            $fields[] = "`plate` = :plate";
            $params[':plate'] = $plate;
        }
        if (isset($input['brand']) && trim($input['brand']) !== '') {
            $fields[] = "`brand` = :brand";
            $params[':brand'] = trim($input['brand']);
        }
        if (isset($input['model']) && trim($input['model']) !== '') {
            $fields[] = "`model` = :model";
            $params[':model'] = trim($input['model']);
        }
        if (isset($input['status'])) {
            $fields[] = "`status` = :status";
            $params[':status'] = $input['status'];
        }
        if (array_key_exists('last_lat', $input)) {
            $fields[] = "`last_lat` = :last_lat";
            $params[':last_lat'] = $input['last_lat'] !== null ? floatval($input['last_lat']) : null;
        }
        if (array_key_exists('last_lng', $input)) {
            $fields[] = "`last_lng` = :last_lng";
            $params[':last_lng'] = $input['last_lng'] !== null ? floatval($input['last_lng']) : null;
        }
        if (isset($input['metrics'])) {
            $fields[] = "`metrics` = :metrics";
            $params[':metrics'] = is_array($input['metrics']) ? json_encode($input['metrics']) : $input['metrics'];
        }

        if (!empty($fields)) {
            $sql = "UPDATE `spinaz_vehicles` SET " . implode(', ', $fields) . " WHERE `id` = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        sendResponse(['success' => true, 'id' => $targetId, 'updated' => true]);
    }

    // CASO 2: Alta de nuevo vehículo
    if (empty($plate)) {
        sendResponse(['error' => 'La patente es requerida'], 400);
    }

    $newId = !empty($id) ? $id : generateUuid();
    $brand = trim($input['brand'] ?? 'Genérica');
    $model = trim($input['model'] ?? 'Estándar');
    $status = $input['status'] ?? 'active';
    $lat = isset($input['last_lat']) ? floatval($input['last_lat']) : null;
    $lng = isset($input['last_lng']) ? floatval($input['last_lng']) : null;
    $metrics = isset($input['metrics']) ? (is_array($input['metrics']) ? json_encode($input['metrics']) : $input['metrics']) : null;

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_vehicles` (`id`, `plate`, `brand`, `model`, `status`, `last_lat`, `last_lng`, `metrics`)
        VALUES (:id, :plate, :brand, :model, :status, :lat, :lng, :metrics)
    ");
    $stmt->execute([
        ':id' => $newId,
        ':plate' => $plate,
        ':brand' => $brand,
        ':model' => $model,
        ':status' => $status,
        ':lat' => $lat,
        ':lng' => $lng,
        ':metrics' => $metrics
    ]);

    sendResponse(['success' => true, 'id' => $newId, 'created' => true]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (!empty($id)) {
        $stmt = $pdo->prepare("DELETE FROM `spinaz_vehicles` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true]);
    }
    sendResponse(['error' => 'ID requerido para eliminar'], 400);
}

sendResponse(['error' => 'Acción no soportada'], 400);
