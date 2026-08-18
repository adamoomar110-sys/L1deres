<?php
// ============================================================
// INCIDENTS API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $statusFilter = $_GET['status'] ?? '';
    $driverFilter = $_GET['driver_id'] ?? '';
    $vehicleFilter = $_GET['vehicle_id'] ?? '';

    $sql = "
        SELECT 
            i.*,
            p.full_name AS driver_name,
            p.email AS driver_email,
            p.phone AS driver_phone,
            v.plate AS vehicle_plate,
            v.brand AS vehicle_brand,
            v.model AS vehicle_model
        FROM `spinaz_incidents` i
        LEFT JOIN `spinaz_profiles` p ON i.driver_id = p.id
        LEFT JOIN `spinaz_vehicles` v ON i.vehicle_id = v.id
        WHERE 1=1
    ";
    $params = [];

    if (!empty($statusFilter) && $statusFilter !== 'all') {
        $sql .= " AND i.`status` = :st";
        $params[':st'] = $statusFilter;
    }
    if (!empty($driverFilter)) {
        $sql .= " AND i.`driver_id` = :did";
        $params[':did'] = $driverFilter;
    }
    if (!empty($vehicleFilter)) {
        $sql .= " AND i.`vehicle_id` = :vid";
        $params[':vid'] = $vehicleFilter;
    }

    $sql .= " ORDER BY i.`created_at` DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rawIncidents = $stmt->fetchAll();

    $incidents = [];
    foreach ($rawIncidents as $r) {
        $incidents[] = [
            'id' => $r['id'],
            'driver_id' => $r['driver_id'],
            'vehicle_id' => $r['vehicle_id'],
            'description' => $r['description'],
            'photo_url' => $r['photo_url'],
            'audio_url' => $r['audio_url'],
            'status' => $r['status'] ?? 'open',
            'created_at' => $r['created_at'],
            'driver_name' => $r['driver_name'] ?? 'Sin asignar',
            'vehicle_plate' => $r['vehicle_plate'] ?? '-',
            'profiles' => [
                'full_name' => $r['driver_name'] ?? 'Sin asignar',
                'email' => $r['driver_email'] ?? '',
                'phone' => $r['driver_phone'] ?? ''
            ],
            'vehicles' => [
                'plate' => $r['vehicle_plate'] ?? '-',
                'brand' => $r['vehicle_brand'] ?? '',
                'model' => $r['vehicle_model'] ?? ''
            ]
        ];
    }

    sendResponse(['success' => true, 'incidents' => $incidents]);
}

if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? $_GET['id'] ?? '';
    
    // CASO 1: Si viene un ID y existe en la base de datos -> Actualización
    if (!empty($id)) {
        $stmtCheck = $pdo->prepare("SELECT * FROM `spinaz_incidents` WHERE `id` = :id LIMIT 1");
        $stmtCheck->execute([':id' => $id]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $fields = [];
            $params = [':id' => $id];

            if (isset($input['status'])) {
                $fields[] = "`status` = :st";
                $params[':st'] = $input['status'];
            }
            if (isset($input['description']) && trim($input['description']) !== '') {
                $fields[] = "`description` = :desc";
                $params[':desc'] = trim($input['description']);
            }
            if (isset($input['photo_url'])) {
                $fields[] = "`photo_url` = :purl";
                $params[':purl'] = $input['photo_url'];
            }
            if (isset($input['audio_url'])) {
                $fields[] = "`audio_url` = :aurl";
                $params[':aurl'] = $input['audio_url'];
            }
            if (isset($input['vehicle_id'])) {
                $fields[] = "`vehicle_id` = :vid";
                $params[':vid'] = $input['vehicle_id'];
            }
            if (isset($input['driver_id'])) {
                $fields[] = "`driver_id` = :did";
                $params[':did'] = $input['driver_id'];
            }

            if (!empty($fields)) {
                $sql = "UPDATE `spinaz_incidents` SET " . implode(', ', $fields) . " WHERE `id` = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            sendResponse(['success' => true, 'id' => $id, 'updated' => true]);
        }
    }

    // CASO 2: Nuevo Incidente (o inserción con ID generado)
    $newId = !empty($id) ? $id : generateUuid();
    $driverId = $input['driver_id'] ?? null;
    $vehicleId = $input['vehicle_id'] ?? null;
    $description = trim($input['description'] ?? '');
    $photoUrl = $input['photo_url'] ?? null;
    $audioUrl = $input['audio_url'] ?? null;
    $status = $input['status'] ?? 'open';

    if (empty($description)) {
        sendResponse(['error' => 'La descripción es obligatoria'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_incidents` (`id`, `driver_id`, `vehicle_id`, `description`, `photo_url`, `audio_url`, `status`)
        VALUES (:id, :did, :vid, :desc, :purl, :aurl, :st)
        ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `description` = VALUES(`description`)
    ");
    $stmt->execute([
        ':id' => $newId,
        ':did' => $driverId,
        ':vid' => $vehicleId,
        ':desc' => $description,
        ':purl' => $photoUrl,
        ':aurl' => $audioUrl,
        ':st' => $status
    ]);

    sendResponse(['success' => true, 'id' => $newId, 'created' => true]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (!empty($id)) {
        $stmt = $pdo->prepare("DELETE FROM `spinaz_incidents` WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true, 'deleted' => true]);
    }
    sendResponse(['error' => 'ID requerido para eliminar'], 400);
}

sendResponse(['error' => 'Acción no soportada'], 400);

