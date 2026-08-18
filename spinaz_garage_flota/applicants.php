<?php
// ============================================================
// APPLICANTS (POSTULANTES) API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Listar postulantes ───────────────────────────────────
if ($method === 'GET') {
    $id = $_GET['id'] ?? '';
    if (!empty($id)) {
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_applicants` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $applicant = $stmt->fetch();
        sendResponse(['success' => true, 'applicant' => $applicant]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `spinaz_applicants` ORDER BY `created_at` DESC");
        $applicants = $stmt->fetchAll();
        sendResponse(['success' => true, 'applicants' => $applicants]);
    }
}

// ── DELETE: Eliminar postulante ──────────────────────────────
if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';

    if (empty($id)) {
        sendResponse(['error' => 'ID requerido para eliminar'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM `spinaz_applicants` WHERE `id` = :id");
    $stmt->execute([':id' => $id]);
    sendResponse(['success' => true, 'message' => 'Postulante eliminado correctamente']);
}

// ── POST / PUT: Crear, Actualizar, Aprobar, Rechazar, Contratar ─
if ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $action = $_GET['action'] ?? $input['action'] ?? '';
    $id = $input['id'] ?? $_GET['id'] ?? '';
    $status = $input['status'] ?? '';

    // 1. Acción de Aceptar / Contratar y pasar a Choferes
    if ($action === 'hire' || $action === 'approve' || $status === 'approved') {
        $applicantId = $id;
        $stmt = $pdo->prepare("SELECT * FROM `spinaz_applicants` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $applicantId]);
        $applicant = $stmt->fetch();

        if (!$applicant) {
            sendResponse(['error' => 'Postulante no encontrado'], 404);
        }

        $email = $input['email'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $applicant['full_name'])) . '@spinazgarage.com';
        $password = $input['password'] ?? '123456';
        $driverId = generateUuid();
        $hash = password_hash($password, PASSWORD_BCRYPT);

        // Crear chofer en la tabla de usuarios / perfiles
        $stmtDriver = $pdo->prepare("
            INSERT INTO `spinaz_profiles` (`id`, `email`, `password_hash`, `full_name`, `role`, `phone`, `dni`)
            VALUES (:id, :email, :pass, :name, 'driver', :phone, :dni)
            ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `role` = 'driver', `phone` = VALUES(`phone`), `dni` = VALUES(`dni`)
        ");
        $stmtDriver->execute([
            ':id' => $driverId,
            ':email' => $email,
            ':pass' => $hash,
            ':name' => $applicant['full_name'],
            ':phone' => $applicant['phone'],
            ':dni' => $applicant['dni']
        ]);

        // Eliminar de postulantes para que ya no figure en la lista de postulaciones pendientes
        $stmtDel = $pdo->prepare("DELETE FROM `spinaz_applicants` WHERE `id` = :id");
        $stmtDel->execute([':id' => $applicantId]);

        sendResponse([
            'success' => true,
            'message' => '¡Chofer aceptado y dado de alta en la flota!',
            'driver_id' => $driverId,
            'email' => $email,
            'password' => $password,
            'moved_to_drivers' => true
        ]);
    }

    // 2. Rechazar postulante
    if (!empty($id) && ($status === 'rejected' || $action === 'reject')) {
        $stmt = $pdo->prepare("UPDATE `spinaz_applicants` SET `status` = 'rejected' WHERE `id` = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true, 'id' => $id, 'status' => 'rejected']);
    }


    // 3. Actualización genérica de campos si viene un ID
    if (!empty($id) && empty($input['full_name'])) {
        $fields = [];
        $params = [':id' => $id];
        foreach ($input as $key => $val) {
            if ($key !== 'id') {
                $fields[] = "`{$key}` = :{$key}";
                $params[":{$key}"] = $val;
            }
        }
        if (!empty($fields)) {
            $sql = "UPDATE `spinaz_applicants` SET " . implode(', ', $fields) . " WHERE `id` = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            sendResponse(['success' => true, 'id' => $id]);
        }
    }

    // 4. Crear nueva postulación pública
    $newId = !empty($id) ? $id : generateUuid();
    $fullName = trim($input['full_name'] ?? '');
    $dni = trim($input['dni'] ?? '');
    $age = isset($input['age']) ? intval($input['age']) : null;
    $phone = trim($input['phone'] ?? '');
    $zone = trim($input['zone'] ?? '');
    $appExp = trim($input['app_experience'] ?? '');
    $accidentHist = trim($input['accident_history'] ?? '');
    $hasProfLic = !empty($input['has_professional_license']) ? 1 : 0;
    $canPayAdv = !empty($input['can_pay_advance']) ? 1 : 0;

    $dniFrontUrl = $input['dni_front_url'] ?? null;
    $dniBackUrl = $input['dni_back_url'] ?? null;
    $licenseUrl = $input['license_url'] ?? null;
    $selfieUrl = $input['selfie_url'] ?? null;

    if (empty($fullName) || empty($dni) || empty($phone)) {
        sendResponse(['error' => 'Nombre completo, DNI y teléfono son obligatorios'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_applicants` (
            `id`, `full_name`, `dni`, `age`, `phone`, `zone`, `app_experience`, `accident_history`,
            `has_professional_license`, `can_pay_advance`, `dni_front_url`, `dni_back_url`, `license_url`, `selfie_url`, `status`
        ) VALUES (
            :id, :name, :dni, :age, :phone, :zone, :exp, :acc,
            :prof, :adv, :front, :back, :lic, :selfie, 'pending'
        )
    ");
    $stmt->execute([
        ':id' => $newId,
        ':name' => $fullName,
        ':dni' => $dni,
        ':age' => $age,
        ':phone' => $phone,
        ':zone' => $zone,
        ':exp' => $appExp,
        ':acc' => $accidentHist,
        ':prof' => $hasProfLic,
        ':adv' => $canPayAdv,
        ':front' => $dniFrontUrl,
        ':back' => $dniBackUrl,
        ':lic' => $licenseUrl,
        ':selfie' => $selfieUrl
    ]);

    sendResponse(['success' => true, 'id' => $newId]);
}

sendResponse(['error' => 'Acción no soportada'], 400);

