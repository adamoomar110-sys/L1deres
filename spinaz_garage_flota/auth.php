<?php
// ============================================================
// AUTHENTICATION & PROFILES API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'login';

if ($action === 'login') {
    $input = getJsonInput();
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($email) || empty($password)) {
        sendResponse(['error' => 'Por favor ingrese email y contraseña'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM `spinaz_profiles` WHERE `email` = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Fallback if password is matching standard 123456 or bcrypt hash
    $isMatch = false;
    if ($user) {
        if (password_verify($password, $user['password_hash']) || $password === '123456') {
            $isMatch = true;
        }
    }

    if (!$isMatch) {
        sendResponse(['error' => 'Credenciales incorrectas. Verifique su email o clave.'], 401);
    }

    // Build session token response
    $session = [
        'access_token' => base64_encode(json_encode(['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'time' => time()])),
        'token_type' => 'bearer',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'phone' => $user['phone'],
            'dni' => $user['dni'],
            'vehicle_id' => $user['vehicle_id'],
            'metrics' => json_decode($user['metrics'] ?? '{}', true)
        ]
    ];

    sendResponse(['success' => true, 'session' => $session, 'user' => $session['user']]);
}

if ($action === 'profile') {
    $userId = $_GET['id'] ?? '';
    if (empty($userId)) {
        sendResponse(['error' => 'ID de usuario requerido'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM `spinaz_profiles` WHERE `id` = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'Perfil no encontrado'], 404);
    }

    $user['metrics'] = json_decode($user['metrics'] ?? '{}', true);
    unset($user['password_hash']);

    sendResponse(['success' => true, 'profile' => $user]);
}

if ($action === 'list') {
    $role = $_GET['role'] ?? '';
    $sql = "SELECT `id`, `email`, `full_name`, `role`, `phone`, `dni`, `vehicle_id`, `metrics`, `created_at` FROM `spinaz_profiles`";
    $params = [];
    if (!empty($role)) {
        $sql .= " WHERE `role` = :r";
        $params[':r'] = $role;
    }
    $sql .= " ORDER BY `full_name` ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $profiles = $stmt->fetchAll();
    foreach ($profiles as &$p) {
        $p['metrics'] = json_decode($p['metrics'] ?? '{}', true);
    }
    sendResponse(['success' => true, 'profiles' => $profiles]);
}

if ($action === 'create' || $action === 'update') {
    $input = getJsonInput();
    $id = $input['id'] ?? $_GET['id'] ?? '';
    
    // Verificar si el usuario ya existe
    $existing = null;
    if (!empty($id)) {
        $stmtCheck = $pdo->prepare("SELECT * FROM `spinaz_profiles` WHERE `id` = :id LIMIT 1");
        $stmtCheck->execute([':id' => $id]);
        $existing = $stmtCheck->fetch();
    }

    // CASO 1: Actualización de perfil existente (permite actualizar campos individuales como vehicle_id, phone, rol, etc.)
    if ($existing) {
        $fields = [];
        $params = [':id' => $id];

        if (isset($input['full_name']) && trim($input['full_name']) !== '') {
            $fields[] = "`full_name` = :name";
            $params[':name'] = trim($input['full_name']);
        }
        if (isset($input['email']) && trim($input['email']) !== '') {
            $fields[] = "`email` = :email";
            $params[':email'] = trim($input['email']);
        }
        if (isset($input['role'])) {
            $fields[] = "`role` = :role";
            $params[':role'] = $input['role'];
        }
        if (array_key_exists('phone', $input)) {
            $fields[] = "`phone` = :phone";
            $params[':phone'] = $input['phone'];
        }
        if (array_key_exists('dni', $input)) {
            $fields[] = "`dni` = :dni";
            $params[':dni'] = $input['dni'];
        }
        if (array_key_exists('vehicle_id', $input)) {
            $fields[] = "`vehicle_id` = :vid";
            $params[':vid'] = !empty($input['vehicle_id']) ? $input['vehicle_id'] : null;
        }
        if (isset($input['password']) && trim($input['password']) !== '') {
            $fields[] = "`password_hash` = :pass";
            $params[':pass'] = password_hash(trim($input['password']), PASSWORD_BCRYPT);
        }
        if (isset($input['metrics'])) {
            $fields[] = "`metrics` = :metrics";
            $params[':metrics'] = is_array($input['metrics']) ? json_encode($input['metrics']) : $input['metrics'];
        }

        if (!empty($fields)) {
            $sql = "UPDATE `spinaz_profiles` SET " . implode(', ', $fields) . " WHERE `id` = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        sendResponse(['success' => true, 'id' => $id, 'updated' => true]);
    }

    // CASO 2: Creación de nuevo perfil
    $email = trim($input['email'] ?? '');
    $fullName = trim($input['full_name'] ?? '');
    $role = $input['role'] ?? 'driver';
    $phone = $input['phone'] ?? null;
    $dni = $input['dni'] ?? null;
    $vehicleId = !empty($input['vehicle_id']) ? $input['vehicle_id'] : null;
    $password = $input['password'] ?? '123456';
    $newId = !empty($id) ? $id : generateUuid();

    if (empty($email) || empty($fullName)) {
        sendResponse(['error' => 'Email y nombre completo son requeridos'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("
        INSERT INTO `spinaz_profiles` (`id`, `email`, `password_hash`, `full_name`, `role`, `phone`, `dni`, `vehicle_id`)
        VALUES (:id, :email, :pass, :name, :role, :phone, :dni, :vid)
        ON DUPLICATE KEY UPDATE
            `full_name` = VALUES(`full_name`),
            `role` = VALUES(`role`),
            `phone` = VALUES(`phone`),
            `dni` = VALUES(`dni`),
            `vehicle_id` = VALUES(`vehicle_id`)
    ");
    $stmt->execute([
        ':id' => $newId,
        ':email' => $email,
        ':pass' => $hash,
        ':name' => $fullName,
        ':role' => $role,
        ':phone' => $phone,
        ':dni' => $dni,
        ':vid' => $vehicleId
    ]);

    sendResponse(['success' => true, 'id' => $newId, 'created' => true]);
}

if ($action === 'delete' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = getJsonInput();
    $userId = $_GET['id'] ?? $input['id'] ?? '';

    if (empty($userId)) {
        sendResponse(['error' => 'ID de usuario requerido para eliminar'], 400);
    }

    $stmtCheck = $pdo->prepare("SELECT `role` FROM `spinaz_profiles` WHERE `id` = :id");
    $stmtCheck->execute([':id' => $userId]);
    $row = $stmtCheck->fetch();

    if ($row && $row['role'] === 'admin' && ($userId === 'u-admin-01' || $userId === 'u-admin-03' || $userId === 'u-admin-04')) {
        sendResponse(['error' => 'El Administrador Principal está protegido y no se puede eliminar.'], 403);
    }

    $stmt = $pdo->prepare("DELETE FROM `spinaz_profiles` WHERE `id` = :id");
    $stmt->execute([':id' => $userId]);

    sendResponse(['success' => true, 'message' => 'Usuario eliminado correctamente']);
}

sendResponse(['error' => 'Acción no válida'], 400);
