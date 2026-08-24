<?php
// ============================================================
// ENDPOINT SOCIOS FUNDADORES — CLUB 200 VIP (Aura v1.8 - DonWeb)
// Asignación de número de socio del 1 al 200 (Black y Gold)
// ============================================================

require_once __DIR__ . '/config.php';

// Asegurar que la tabla existe
function ensureSociosTable($pdo) {
    if (!$pdo) return;
    $sql = "
    CREATE TABLE IF NOT EXISTS `socios_fundadores` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `numero_socio` INT NOT NULL UNIQUE,
      `tipo_membresia` VARCHAR(20) NOT NULL DEFAULT 'black',
      `nombre` VARCHAR(150) NOT NULL,
      `telefono` VARCHAR(50) NOT NULL,
      `email` VARCHAR(150) NULL,
      `patente` VARCHAR(20) NOT NULL,
      `modelo_auto` VARCHAR(100) NULL,
      `monto_pagado` DECIMAL(10,2) DEFAULT 0.00,
      `metodo_pago` VARCHAR(50) DEFAULT 'mercadopago',
      `estado_pago` VARCHAR(30) DEFAULT 'pagado',
      `observaciones` TEXT NULL,
      `fecha_inscripcion` DATETIME DEFAULT CURRENT_TIMESTAMP,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX `idx_numero_socio` (`numero_socio`),
      INDEX `idx_patente` (`patente`),
      INDEX `idx_tipo` (`tipo_membresia`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    try {
        $pdo->exec($sql);
    } catch (Exception $e) {
        // Ignorar si ya existe
    }
}

// Obtener el próximo número de socio disponible entre 1 y 200
function getNextAvailableNumber($pdo) {
    if (!$pdo) return 1;
    $stmt = $pdo->query("SELECT numero_socio FROM `socios_fundadores` ORDER BY numero_socio ASC");
    $taken = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $takenMap = array_flip($taken);

    for ($i = 1; $i <= 200; $i++) {
        if (!isset($takenMap[$i])) {
            return $i;
        }
    }
    return null; // Cupos agotados (los 200 están ocupados)
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// -------------------------------------------------------------
// VERIFICAR PATENTE O CONSULTA ESPECÍFICA (GET ?check=PATENTE)
// -------------------------------------------------------------
if ($method === 'GET' && !empty($_GET['check'])) {
    $patente = strtoupper(trim($_GET['check']));
    if ($pdo) {
        ensureSociosTable($pdo);
        $stmt = $pdo->prepare("SELECT * FROM `socios_fundadores` WHERE UPPER(patente) = :patente LIMIT 1");
        $stmt->execute([':patente' => $patente]);
        $socio = $stmt->fetch();
        if ($socio) {
            sendResponse([
                'success' => true,
                'es_socio' => true,
                'socio' => $socio
            ]);
        }
    }
    sendResponse([
        'success' => true,
        'es_socio' => false,
        'mensaje' => 'Patente no registrada como Socio Fundador'
    ]);
}

// -------------------------------------------------------------
// LISTAR SOCIOS Y ESTADÍSTICAS (GET)
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        // Fallback si no hay conexión a BD
        sendResponse([
            'success' => true,
            'stats' => [
                'total_cupos' => 200,
                'ocupados' => 0,
                'disponibles' => 200,
                'black' => 0,
                'gold' => 0,
                'recaudado' => 0,
                'proximo_numero' => 1
            ],
            'socios' => []
        ]);
    }

    ensureSociosTable($pdo);

    $tipoFilter = isset($_GET['tipo']) ? strtolower(trim($_GET['tipo'])) : '';
    $estadoFilter = isset($_GET['estado']) ? strtolower(trim($_GET['estado'])) : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $where = [];
    $params = [];

    if (!empty($tipoFilter) && in_array($tipoFilter, ['black', 'gold'])) {
        $where[] = "tipo_membresia = :tipo";
        $params[':tipo'] = $tipoFilter;
    }

    if (!empty($estadoFilter)) {
        $where[] = "estado_pago = :estado";
        $params[':estado'] = $estadoFilter;
    }

    if (!empty($search)) {
        $where[] = "(nombre LIKE :s1 OR patente LIKE :s2 OR telefono LIKE :s3 OR numero_socio = :s4)";
        $params[':s1'] = "%{$search}%";
        $params[':s2'] = "%{$search}%";
        $params[':s3'] = "%{$search}%";
        $params[':s4'] = is_numeric($search) ? intval($search) : 0;
    }

    $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $pdo->prepare("SELECT * FROM `socios_fundadores` {$whereClause} ORDER BY numero_socio ASC");
    $stmt->execute($params);
    $socios = $stmt->fetchAll();

    // Estadísticas globales del Club 200
    $statsStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_ocupados,
            SUM(CASE WHEN LOWER(tipo_membresia) = 'black' THEN 1 ELSE 0 END) as total_black,
            SUM(CASE WHEN LOWER(tipo_membresia) = 'gold' THEN 1 ELSE 0 END) as total_gold,
            SUM(CASE WHEN estado_pago = 'pagado' THEN monto_pagado ELSE 0 END) as total_recaudado
        FROM `socios_fundadores`
    ");
    $statsRow = $statsStmt->fetch() ?: [];

    $totalOcupados = intval($statsRow['total_ocupados'] ?? 0);
    $totalDisponibles = max(0, 200 - $totalOcupados);
    $proximoNum = getNextAvailableNumber($pdo);

    sendResponse([
        'success' => true,
        'stats' => [
            'total_cupos' => 200,
            'ocupados' => $totalOcupados,
            'disponibles' => $totalDisponibles,
            'black' => intval($statsRow['total_black'] ?? 0),
            'gold' => intval($statsRow['total_gold'] ?? 0),
            'recaudado' => floatval($statsRow['total_recaudado'] ?? 0),
            'proximo_numero' => $proximoNum
        ],
        'socios' => $socios
    ]);
}

// -------------------------------------------------------------
// REGISTRAR NUEVO SOCIO FUNDADOR (POST)
// -------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $patente = isset($input['patente']) ? strtoupper(trim($input['patente'])) : '';
    $modelo_auto = isset($input['modelo_auto']) ? trim($input['modelo_auto']) : '';
    $tipo_membresia = isset($input['tipo_membresia']) && strtolower(trim($input['tipo_membresia'])) === 'gold' ? 'gold' : 'black';
    $monto_pagado = isset($input['monto_pagado']) ? floatval($input['monto_pagado']) : ($tipo_membresia === 'black' ? 65000.00 : 45000.00);
    $metodo_pago = isset($input['metodo_pago']) ? trim($input['metodo_pago']) : 'mercadopago';
    $estado_pago = isset($input['estado_pago']) ? trim($input['estado_pago']) : 'pagado';
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : '';
    $customNumero = isset($input['numero_socio']) ? intval($input['numero_socio']) : null;

    if (empty($nombre) || empty($patente)) {
        sendResponse(['success' => false, 'error' => 'Nombre y Patente son obligatorios.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos.'], 500);
    }

    ensureSociosTable($pdo);

    // Validar si la patente ya está registrada como socio fundador
    $checkPat = $pdo->prepare("SELECT id, numero_socio FROM `socios_fundadores` WHERE UPPER(patente) = :patente LIMIT 1");
    $checkPat->execute([':patente' => $patente]);
    $existente = $checkPat->fetch();
    if ($existente) {
        sendResponse([
            'success' => false,
            'error' => "La patente {$patente} ya está registrada como Socio Fundador con el N° #{$existente['numero_socio']}."
        ], 409);
    }

    // Determinar número de socio entre 1 y 200
    $numeroAsignado = null;

    if ($customNumero !== null && $customNumero >= 1 && $customNumero <= 200) {
        // Verificar si el número solicitado está libre
        $checkNum = $pdo->prepare("SELECT id FROM `socios_fundadores` WHERE numero_socio = :num LIMIT 1");
        $checkNum->execute([':num' => $customNumero]);
        if ($checkNum->fetch()) {
            sendResponse([
                'success' => false,
                'error' => "El número de socio #{$customNumero} ya está ocupado. Selecciona otro o usa asignación automática."
            ], 409);
        }
        $numeroAsignado = $customNumero;
    } else {
        // Asignación automática del 1 al 200
        $numeroAsignado = getNextAvailableNumber($pdo);
        if ($numeroAsignado === null) {
            sendResponse([
                'success' => false,
                'error' => '¡Cupos completados! El Club de 200 Socios Fundadores ya alcanzó su límite máximo de miembros.'
            ], 400);
        }
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `socios_fundadores` 
            (`numero_socio`, `tipo_membresia`, `nombre`, `telefono`, `email`, `patente`, `modelo_auto`, `monto_pagado`, `metodo_pago`, `estado_pago`, `observaciones`, `fecha_inscripcion`)
            VALUES 
            (:numero, :tipo, :nombre, :telefono, :email, :patente, :modelo, :monto, :metodo, :estado, :obs, NOW())
        ");
        $stmt->execute([
            ':numero' => $numeroAsignado,
            ':tipo' => $tipo_membresia,
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':email' => $email,
            ':patente' => $patente,
            ':modelo' => $modelo_auto,
            ':monto' => $monto_pagado,
            ':metodo' => $metodo_pago,
            ':estado' => $estado_pago,
            ':obs' => $observaciones
        ]);

        $newId = $pdo->lastInsertId();

        sendResponse([
            'success' => true,
            'message' => "¡Socio Fundador #{$numeroAsignado} registrado exitosamente!",
            'socio' => [
                'id' => $newId,
                'numero_socio' => $numeroAsignado,
                'numero_formateado' => sprintf("#%03d", $numeroAsignado),
                'tipo_membresia' => $tipo_membresia,
                'nombre' => $nombre,
                'telefono' => $telefono,
                'email' => $email,
                'patente' => $patente,
                'modelo_auto' => $modelo_auto,
                'monto_pagado' => $monto_pagado,
                'estado_pago' => $estado_pago
            ]
        ], 201);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al registrar socio: ' . $e->getMessage()], 500);
    }
}

// -------------------------------------------------------------
// ACTUALIZAR SOCIO FUNDADOR (PUT)
// -------------------------------------------------------------
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = isset($input['id']) ? intval($input['id']) : 0;

    if ($id <= 0) {
        sendResponse(['success' => false, 'error' => 'ID de socio inválido.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos.'], 500);
    }

    ensureSociosTable($pdo);

    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $patente = isset($input['patente']) ? strtoupper(trim($input['patente'])) : '';
    $modelo_auto = isset($input['modelo_auto']) ? trim($input['modelo_auto']) : '';
    $tipo_membresia = isset($input['tipo_membresia']) && strtolower(trim($input['tipo_membresia'])) === 'gold' ? 'gold' : 'black';
    $monto_pagado = isset($input['monto_pagado']) ? floatval($input['monto_pagado']) : 0.00;
    $metodo_pago = isset($input['metodo_pago']) ? trim($input['metodo_pago']) : 'mercadopago';
    $estado_pago = isset($input['estado_pago']) ? trim($input['estado_pago']) : 'pagado';
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : '';

    try {
        $stmt = $pdo->prepare("
            UPDATE `socios_fundadores` SET
                `nombre` = :nombre,
                `telefono` = :telefono,
                `email` = :email,
                `patente` = :patente,
                `modelo_auto` = :modelo,
                `tipo_membresia` = :tipo,
                `monto_pagado` = :monto,
                `metodo_pago` = :metodo,
                `estado_pago` = :estado,
                `observaciones` = :obs
            WHERE `id` = :id
        ");
        $stmt->execute([
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':email' => $email,
            ':patente' => $patente,
            ':modelo' => $modelo_auto,
            ':tipo' => $tipo_membresia,
            ':monto' => $monto_pagado,
            ':metodo' => $metodo_pago,
            ':estado' => $estado_pago,
            ':obs' => $observaciones,
            ':id' => $id
        ]);

        sendResponse(['success' => true, 'message' => 'Socio Fundador actualizado correctamente.']);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al actualizar socio: ' . $e->getMessage()], 500);
    }
}

// -------------------------------------------------------------
// ELIMINAR SOCIO FUNDADOR (DELETE)
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : 0;
    }

    if ($id <= 0) {
        sendResponse(['success' => false, 'error' => 'ID de socio requerido.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos.'], 500);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `socios_fundadores` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        sendResponse(['success' => true, 'message' => 'Socio eliminado. El cupo y número quedaron liberados.']);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al eliminar: ' . $e->getMessage()], 500);
    }
}

sendResponse(['success' => false, 'error' => 'Método no permitido.'], 405);
