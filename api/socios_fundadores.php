<?php
// ============================================================
// ENDPOINT SOCIOS FUNDADORES — CLUB 100 VIP (Aura v1.8 - DonWeb)
// Gestión integral, guardado y carga completa de todos los datos
// ============================================================

require_once __DIR__ . '/config.php';

// Asegurar que la tabla y todas sus columnas existan
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
      `fecha_nacimiento` VARCHAR(30) NULL,
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
    } catch (Exception $e) {}

    // Agregar fecha_nacimiento si la tabla ya existía sin esa columna
    try {
        $pdo->exec("ALTER TABLE `socios_fundadores` ADD COLUMN `fecha_nacimiento` VARCHAR(30) NULL AFTER `email`");
    } catch (Exception $e) {}
}

// Formatear socio para compatibilidad total con Frontend Admin, Cliente y Landing
function formatSocioRow($row) {
    if (!$row) return null;
    $num = intval($row['numero_socio'] ?? 0);
    $tipo = strtolower(trim($row['tipo_membresia'] ?? 'black'));
    $estado = strtolower(trim($row['estado_pago'] ?? 'pagado'));
    $monto = floatval($row['monto_pagado'] ?? 0);

    return [
        'id' => intval($row['id'] ?? 0),
        'numero_socio' => $num,
        'numero' => sprintf("#%03d", $num),
        'tipo_membresia' => $tipo,
        'tipo' => strtoupper($tipo),
        'nombre' => $row['nombre'] ?? '',
        'titular' => $row['nombre'] ?? '',
        'telefono' => $row['telefono'] ?? '',
        'email' => $row['email'] ?? '',
        'fecha_nacimiento' => $row['fecha_nacimiento'] ?? '',
        'patente' => strtoupper(trim($row['patente'] ?? '')),
        'modelo_auto' => $row['modelo_auto'] ?? '',
        'modelo' => $row['modelo_auto'] ?? '',
        'monto_pagado' => $monto,
        'monto' => $monto,
        'metodo_pago' => $row['metodo_pago'] ?? 'mercadopago',
        'estado_pago' => $estado,
        'estado' => $estado === 'pagado' || $estado === 'activo' ? 'PAGADO' : 'PENDIENTE',
        'observaciones' => $row['observaciones'] ?? '',
        'notas' => $row['observaciones'] ?? '',
        'fecha_inscripcion' => $row['fecha_inscripcion'] ?? date('Y-m-d H:i:s'),
        'created_at' => $row['created_at'] ?? date('Y-m-d H:i:s')
    ];
}

// Obtener el próximo número de socio disponible entre 1 y 100
function getNextAvailableNumber($pdo) {
    if (!$pdo) return 1;
    $stmt = $pdo->query("SELECT numero_socio FROM `socios_fundadores` ORDER BY numero_socio ASC");
    $taken = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $takenMap = array_flip($taken);

    for ($i = 1; $i <= 100; $i++) {
        if (!isset($takenMap[$i])) {
            return $i;
        }
    }
    return null; // Cupos agotados
}

$method = $_SERVER['REQUEST_METHOD'];

// -------------------------------------------------------------
// 1. VERIFICAR PATENTE O CONSULTA ESPECÍFICA (GET ?check=PATENTE)
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
                'socio' => formatSocioRow($socio)
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
// 2. LISTAR SOCIOS Y ESTADÍSTICAS (GET)
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendResponse([
            'success' => true,
            'stats' => [
                'total_cupos' => 100,
                'ocupados' => 0,
                'disponibles' => 100,
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
        $where[] = "LOWER(tipo_membresia) = :tipo";
        $params[':tipo'] = $tipoFilter;
    }

    if (!empty($estadoFilter) && $estadoFilter !== 'all') {
        if ($estadoFilter === 'pagado' || $estadoFilter === 'activo') {
            $where[] = "LOWER(estado_pago) IN ('pagado', 'activo')";
        } else {
            $where[] = "LOWER(estado_pago) NOT IN ('pagado', 'activo')";
        }
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
    $rows = $stmt->fetchAll();

    $socios = array_map('formatSocioRow', $rows);

    // Estadísticas globales del Club 100
    $statsStmt = $pdo->query("
        SELECT 
            COUNT(*) as total_ocupados,
            SUM(CASE WHEN LOWER(tipo_membresia) = 'black' THEN 1 ELSE 0 END) as total_black,
            SUM(CASE WHEN LOWER(tipo_membresia) = 'gold' THEN 1 ELSE 0 END) as total_gold,
            SUM(CASE WHEN LOWER(estado_pago) IN ('pagado', 'activo') THEN monto_pagado ELSE 0 END) as total_recaudado
        FROM `socios_fundadores`
    ");
    $statsRow = $statsStmt->fetch() ?: [];

    $totalOcupados = intval($statsRow['total_ocupados'] ?? 0);
    $totalDisponibles = max(0, 100 - $totalOcupados);
    $proximoNum = getNextAvailableNumber($pdo);

    sendResponse([
        'success' => true,
        'stats' => [
            'total_cupos' => 100,
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
// 3. REGISTRAR NUEVO SOCIO FUNDADOR (POST)
// -------------------------------------------------------------
if ($method === 'POST') {
    $input = getJsonInput();

    // Normalizar nombres de campos cruzados (admin / cliente)
    $nombre = trim($input['nombre'] ?? $input['titular'] ?? '');
    $patente = strtoupper(trim($input['patente'] ?? ''));
    $telefono = trim($input['telefono'] ?? '');
    $email = trim($input['email'] ?? '');
    $fecha_nac = trim($input['fecha_nacimiento'] ?? $input['fecha_nac'] ?? '');
    $modelo_auto = trim($input['modelo_auto'] ?? $input['modelo'] ?? '');
    
    $rawTipo = strtolower(trim($input['tipo_membresia'] ?? $input['tipo'] ?? 'black'));
    $tipo_membresia = ($rawTipo === 'gold') ? 'gold' : 'black';

    $defaultMonto = ($tipo_membresia === 'gold') ? 45000.00 : 65000.00;
    $monto_pagado = isset($input['monto_pagado']) ? floatval($input['monto_pagado']) : (isset($input['monto']) ? floatval($input['monto']) : $defaultMonto);

    $metodo_pago = trim($input['metodo_pago'] ?? 'mercadopago');
    $rawEstado = strtolower(trim($input['estado_pago'] ?? $input['estado'] ?? 'pagado'));
    $estado_pago = ($rawEstado === 'pendiente') ? 'pendiente' : 'pagado';
    $observaciones = trim($input['observaciones'] ?? $input['notas'] ?? '');

    // Parsear número si viene especificado
    $customNumero = null;
    if (isset($input['numero_socio']) && is_numeric($input['numero_socio'])) {
        $customNumero = intval($input['numero_socio']);
    } elseif (isset($input['numero'])) {
        $cleanNum = preg_replace('/\D/', '', $input['numero']);
        if (is_numeric($cleanNum) && intval($cleanNum) > 0) {
            $customNumero = intval($cleanNum);
        }
    }

    if (empty($nombre) || empty($patente)) {
        sendResponse(['success' => false, 'error' => 'Nombre/Titular y Patente son campos obligatorios.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos DonWeb.'], 500);
    }

    ensureSociosTable($pdo);

    // Validar si la patente ya está registrada
    $checkPat = $pdo->prepare("SELECT id, numero_socio FROM `socios_fundadores` WHERE UPPER(patente) = :patente LIMIT 1");
    $checkPat->execute([':patente' => $patente]);
    $existente = $checkPat->fetch();
    if ($existente) {
        sendResponse([
            'success' => false,
            'error' => "La patente {$patente} ya está registrada como Socio Fundador con el N° #" . sprintf("%03d", $existente['numero_socio']) . "."
        ], 409);
    }

    // Asignación de número (1 al 100)
    $numeroAsignado = null;
    if ($customNumero !== null && $customNumero >= 1 && $customNumero <= 100) {
        $checkNum = $pdo->prepare("SELECT id FROM `socios_fundadores` WHERE numero_socio = :num LIMIT 1");
        $checkNum->execute([':num' => $customNumero]);
        if ($checkNum->fetch()) {
            sendResponse([
                'success' => false,
                'error' => "El número de socio #{$customNumero} ya está ocupado. Selecciona otro número o déjalo automático."
            ], 409);
        }
        $numeroAsignado = $customNumero;
    } else {
        $numeroAsignado = getNextAvailableNumber($pdo);
        if ($numeroAsignado === null) {
            sendResponse([
                'success' => false,
                'error' => '¡Cupos agotados! El Club de 100 Socios Fundadores ya completó su límite de miembros.'
            ], 400);
        }
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `socios_fundadores` 
            (`numero_socio`, `tipo_membresia`, `nombre`, `telefono`, `email`, `fecha_nacimiento`, `patente`, `modelo_auto`, `monto_pagado`, `metodo_pago`, `estado_pago`, `observaciones`, `fecha_inscripcion`)
            VALUES 
            (:numero, :tipo, :nombre, :telefono, :email, :fecha_nac, :patente, :modelo, :monto, :metodo, :estado, :obs, NOW())
        ");
        $stmt->execute([
            ':numero' => $numeroAsignado,
            ':tipo' => $tipo_membresia,
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':email' => $email,
            ':fecha_nac' => $fecha_nac,
            ':patente' => $patente,
            ':modelo' => $modelo_auto,
            ':monto' => $monto_pagado,
            ':metodo' => $metodo_pago,
            ':estado' => $estado_pago,
            ':obs' => $observaciones
        ]);

        $newId = $pdo->lastInsertId();

        // Recuperar registro completo
        $stmtGet = $pdo->prepare("SELECT * FROM `socios_fundadores` WHERE `id` = :id LIMIT 1");
        $stmtGet->execute([':id' => $newId]);
        $socioSaved = $stmtGet->fetch();

        sendResponse([
            'success' => true,
            'message' => "¡Socio Fundador #" . sprintf("%03d", $numeroAsignado) . " ({$nombre}) registrado con éxito!",
            'numero_socio' => $numeroAsignado,
            'socio' => formatSocioRow($socioSaved)
        ], 201);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al guardar socio: ' . $e->getMessage()], 500);
    }
}

// -------------------------------------------------------------
// 4. ACTUALIZAR SOCIO FUNDADOR (PUT)
// -------------------------------------------------------------
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = isset($input['id']) ? intval($input['id']) : 0;

    if ($id <= 0) {
        sendResponse(['success' => false, 'error' => 'ID de socio inválido o no especificado.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos DonWeb.'], 500);
    }

    ensureSociosTable($pdo);

    $nombre = trim($input['nombre'] ?? $input['titular'] ?? '');
    $patente = strtoupper(trim($input['patente'] ?? ''));
    $telefono = trim($input['telefono'] ?? '');
    $email = trim($input['email'] ?? '');
    $fecha_nac = trim($input['fecha_nacimiento'] ?? $input['fecha_nac'] ?? '');
    $modelo_auto = trim($input['modelo_auto'] ?? $input['modelo'] ?? '');
    
    $rawTipo = strtolower(trim($input['tipo_membresia'] ?? $input['tipo'] ?? 'black'));
    $tipo_membresia = ($rawTipo === 'gold') ? 'gold' : 'black';

    $monto_pagado = isset($input['monto_pagado']) ? floatval($input['monto_pagado']) : (isset($input['monto']) ? floatval($input['monto']) : 0.00);
    $metodo_pago = trim($input['metodo_pago'] ?? 'mercadopago');
    $rawEstado = strtolower(trim($input['estado_pago'] ?? $input['estado'] ?? 'pagado'));
    $estado_pago = ($rawEstado === 'pendiente') ? 'pendiente' : 'pagado';
    $observaciones = trim($input['observaciones'] ?? $input['notas'] ?? '');

    // Validar patente duplicada en otro registro
    $checkPat = $pdo->prepare("SELECT id FROM `socios_fundadores` WHERE UPPER(patente) = :patente AND id != :id LIMIT 1");
    $checkPat->execute([':patente' => $patente, ':id' => $id]);
    if ($checkPat->fetch()) {
        sendResponse(['success' => false, 'error' => "La patente {$patente} ya pertenece a otro socio fundador."], 409);
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE `socios_fundadores` SET
                `nombre` = :nombre,
                `telefono` = :telefono,
                `email` = :email,
                `fecha_nacimiento` = :fecha_nac,
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
            ':fecha_nac' => $fecha_nac,
            ':patente' => $patente,
            ':modelo' => $modelo_auto,
            ':tipo' => $tipo_membresia,
            ':monto' => $monto_pagado,
            ':metodo' => $metodo_pago,
            ':estado' => $estado_pago,
            ':obs' => $observaciones,
            ':id' => $id
        ]);

        // Retornar datos actualizados
        $stmtGet = $pdo->prepare("SELECT * FROM `socios_fundadores` WHERE `id` = :id LIMIT 1");
        $stmtGet->execute([':id' => $id]);
        $socioUpdated = $stmtGet->fetch();

        sendResponse([
            'success' => true,
            'message' => "Socio Fundador actualizado correctamente.",
            'socio' => formatSocioRow($socioUpdated)
        ]);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al actualizar socio: ' . $e->getMessage()], 500);
    }
}

// -------------------------------------------------------------
// 5. ELIMINAR SOCIO FUNDADOR (DELETE)
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : 0;
    }

    if ($id <= 0) {
        sendResponse(['success' => false, 'error' => 'ID de socio requerido para eliminar.'], 400);
    }

    if (!$pdo) {
        sendResponse(['success' => false, 'error' => 'No hay conexión a la base de datos DonWeb.'], 500);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `socios_fundadores` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        sendResponse([
            'success' => true,
            'message' => 'Socio eliminado exitosamente. El cupo y número quedaron liberados.'
        ]);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'error' => 'Error al eliminar: ' . $e->getMessage()], 500);
    }
}

sendResponse(['success' => false, 'error' => 'Método no permitido.'], 405);
