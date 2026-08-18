<?php
// ============================================================
// TALLER, LUBRICENTRO & LAVADERO SERVICE ORDERS API - SPINAZ GARAGE
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $providerType = $_GET['provider_type'] ?? $_GET['type'] ?? '';
    $status = $_GET['status'] ?? '';
    $vehicleId = $_GET['vehicle_id'] ?? '';
    $plate = $_GET['plate'] ?? '';

    $sql = "SELECT * FROM `spinaz_service_orders` WHERE 1=1";
    $params = [];

    if (!empty($providerType)) {
        $sql .= " AND (`provider_type` = :pt1 OR `type` = :pt2)";
        $params[':pt1'] = $providerType;
        $params[':pt2'] = $providerType;
    }
    if (!empty($status)) {
        $sql .= " AND `status` = :st";
        $params[':st'] = $status;
    }
    if (!empty($vehicleId)) {
        $sql .= " AND `vehicle_id` = :vid";
        $params[':vid'] = $vehicleId;
    }
    if (!empty($plate)) {
        $sql .= " AND `plate` = :p";
        $params[':p'] = strtoupper(trim($plate));
    }

    $sql .= " ORDER BY `created_at` DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // Normalizar nombres de columnas para compatibilidad total
    foreach ($orders as &$o) {
        $pt = $o['provider_type'] ?? $o['type'] ?? 'taller';
        $bg = $o['budget'] ?? $o['cost'] ?? 0;
        $o['provider_type'] = $pt;
        $o['type'] = $pt;
        $o['budget'] = $bg;
        $o['cost'] = $bg;
    }

    sendResponse(['success' => true, 'orders' => $orders, 'service_orders' => $orders]);
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? $_GET['id'] ?? '';
    $vehicleId = $input['vehicle_id'] ?? null;
    $plate = strtoupper(trim($input['plate'] ?? ''));
    $providerType = $input['provider_type'] ?? $input['type'] ?? 'taller';
    $status = $input['status'] ?? 'pending';
    $budget = floatval($input['budget'] ?? $input['cost'] ?? 0);
    $appointmentDate = $input['appointment_date'] ?? null;
    $description = trim($input['description'] ?? '');

    // Si no vino la patente pero vino el vehicle_id, buscar la patente automáticamente
    if (empty($plate) && !empty($vehicleId)) {
        $stmtV = $pdo->prepare("SELECT `plate` FROM `spinaz_vehicles` WHERE `id` = :vid LIMIT 1");
        $stmtV->execute([':vid' => $vehicleId]);
        $rowV = $stmtV->fetch();
        if ($rowV) {
            $plate = $rowV['plate'];
        }
    }

    // Si no vino el vehicle_id pero vino la patente, buscar el vehicle_id
    if (empty($vehicleId) && !empty($plate)) {
        $stmtV = $pdo->prepare("SELECT `id` FROM `spinaz_vehicles` WHERE `plate` = :p LIMIT 1");
        $stmtV->execute([':p' => $plate]);
        $rowV = $stmtV->fetch();
        if ($rowV) {
            $vehicleId = $rowV['id'];
        }
    }

    if (empty($description)) {
        $description = 'Servicio derivado a ' . $providerType;
    }

    // CASO 1: Actualización de orden existente por ID
    if (!empty($id)) {
        $stmtCheck = $pdo->prepare("SELECT * FROM `spinaz_service_orders` WHERE `id` = :id LIMIT 1");
        $stmtCheck->execute([':id' => $id]);
        $existing = $stmtCheck->fetch();
        if ($existing) {
            $fields = [];
            $params = [':id' => $id];
            if (isset($input['status'])) {
                $fields[] = "`status` = :st";
                $params[':st'] = $input['status'];
            }
            if (isset($input['budget']) || isset($input['cost'])) {
                $fields[] = "`budget` = :bg";
                $fields[] = "`cost` = :bg";
                $params[':bg'] = $budget;
            }
            if (isset($input['description']) && trim($input['description']) !== '') {
                $fields[] = "`description` = :d";
                $params[':d'] = trim($input['description']);
            }
            if (!empty($appointmentDate)) {
                $fields[] = "`appointment_date` = :ad";
                $params[':ad'] = $appointmentDate;
            }

            if (!empty($fields)) {
                $sql = "UPDATE `spinaz_service_orders` SET " . implode(', ', $fields) . " WHERE `id` = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
            sendResponse(['success' => true, 'id' => $id, 'updated' => true]);
        }
    }

    // CASO 2: Actualización de orden por vehicle_id y provider_type (ej: marcar como completed al finalizar)
    if (!empty($vehicleId) && !empty($providerType) && isset($input['status']) && $input['status'] === 'completed' && empty($id)) {
        $stmtUpdate = $pdo->prepare("
            UPDATE `spinaz_service_orders` 
            SET `status` = 'completed' 
            WHERE `vehicle_id` = :vid AND (`provider_type` = :pt1 OR `type` = :pt2) AND `status` != 'completed'
        ");
        $stmtUpdate->execute([':vid' => $vehicleId, ':pt1' => $providerType, ':pt2' => $providerType]);
        sendResponse(['success' => true, 'updated_by_vehicle' => true]);
    }

    // CASO 3: Nueva orden de servicio
    $newId = !empty($id) ? $id : generateUuid();
    $safePlate = !empty($plate) ? $plate : 'S/P';

    $stmtInsert = $pdo->prepare("
        INSERT INTO `spinaz_service_orders` 
            (`id`, `vehicle_id`, `plate`, `type`, `provider_type`, `description`, `status`, `cost`, `budget`, `appointment_date`)
        VALUES 
            (:id, :vid, :p, :t, :pt, :d, :st, :c, :bg, :ad)
    ");
    $stmtInsert->execute([
        ':id' => $newId,
        ':vid' => $vehicleId,
        ':p' => $safePlate,
        ':t' => $providerType,
        ':pt' => $providerType,
        ':d' => $description,
        ':st' => $status,
        ':c' => $budget,
        ':bg' => $budget,
        ':ad' => $appointmentDate
    ]);

    sendResponse(['success' => true, 'id' => $newId, 'created' => true]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (!empty($id)) {
        $stmt = $pdo->prepare("DELETE FROM `spinaz_service_orders` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true]);
    }
    sendResponse(['error' => 'ID requerido para eliminar'], 400);
}

sendResponse(['error' => 'Acción no soportada'], 400);
