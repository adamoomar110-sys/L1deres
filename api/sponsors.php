<?php
// ============================================================
// ENDPOINT CONVENIOS, SPONSORS Y ALIANZAS (Aura v1.5 - DonWeb)
// ============================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Asegurar tabla `sponsors` y agregar columnas si faltan
if ($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sponsors` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `nombre` VARCHAR(150) NOT NULL,
          `categoria` VARCHAR(100) DEFAULT 'Convenio',
          `descripcion` TEXT NULL,
          `logo_url` TEXT NULL,
          `enlace` TEXT NULL,
          `activo` TINYINT(1) DEFAULT 1,
          `orden` INT DEFAULT 0,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        $colsToAdd = [
            "ALTER TABLE `sponsors` ADD `categoria` VARCHAR(100) DEFAULT 'Convenio'",
            "ALTER TABLE `sponsors` ADD `descripcion` TEXT NULL",
            "ALTER TABLE `sponsors` ADD `orden` INT DEFAULT 0",
            "ALTER TABLE `sponsors` ADD `activo` TINYINT(1) DEFAULT 1"
        ];

        foreach ($colsToAdd as $sqlCol) {
            try { $pdo->exec($sqlCol); } catch (Exception $e) {}
        }

        // Si la tabla está vacía, sembrar los 6 ejemplos iniciales
        $checkCount = $pdo->query("SELECT COUNT(*) FROM `sponsors`")->fetchColumn();
        if ($checkCount == 0) {
            $defaultItems = [
                [
                    'nombre' => 'Socio Fundador Black',
                    'categoria' => 'Socio Fundador',
                    'descripcion' => 'Acceso prioritario VIP #1 en Pit Lane sin fila, 30% OFF en todos los lavados y encerado cerámico sin cargo.',
                    'logo_url' => 'bx bx-crown',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Black',
                    'orden' => 1
                ],
                [
                    'nombre' => 'Socio Fundador Gold',
                    'categoria' => 'Socio Fundador',
                    'descripcion' => 'Atención preferencial en boxes, 20% OFF en todos los lavados y obsequio de perfumería en cada visita.',
                    'logo_url' => 'bx bxs-award',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Gold',
                    'orden' => 2
                ],
                [
                    'nombre' => 'Uber, Cabify & DiDi Pro',
                    'categoria' => 'Apps de Viajes',
                    'descripcion' => '20% de descuento exclusivo en lavado completo para conductores de aplicaciones de viajes registradas.',
                    'logo_url' => 'bx bxs-taxi',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20soy%20conductor%20de%20app%20de%20viajes',
                    'orden' => 3
                ],
                [
                    'nombre' => 'Country Club Los Lagartos',
                    'categoria' => 'Barrios Cerrados',
                    'descripcion' => 'Atención prioritaria en Pit Lane y tarifa preferencial para residentes de Los Lagartos C.C. y barrios de la zona.',
                    'logo_url' => 'bx bx-home-alt',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20soy%20residente%20de%20Los%20Lagartos',
                    'orden' => 4
                ],
                [
                    'nombre' => 'Empresas & Flotas Corporativas',
                    'categoria' => 'Corporativo',
                    'descripcion' => 'Planes de mantenimiento mensual con Factura A y facturación consolidada para flotas de empresas.',
                    'logo_url' => 'bx bx-building-house',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20quiero%20informacion%20para%20flota%20empresa',
                    'orden' => 5
                ],
                [
                    'nombre' => 'Remises & Taxis Pilar',
                    'categoria' => 'Servicio Público',
                    'descripcion' => 'Lavado express acelerado y combos especiales para unidades de agencias de remises y taxis de Pilar.',
                    'logo_url' => 'bx bx-car',
                    'enlace' => 'https://wa.me/5491123456789?text=Hola,%20soy%20remisero%20de%20Pilar',
                    'orden' => 6
                ],
                [
                    'nombre' => 'Mercado Pago & Bancos',
                    'categoria' => 'Medios de Pago',
                    'descripcion' => 'Promociones especiales y cuotas sin interés abonando con Mercado Pago y bancos adheridos.',
                    'logo_url' => 'bx bx-credit-card',
                    'enlace' => '#',
                    'orden' => 7
                ],
                [
                    'nombre' => 'Aseguradoras Partner',
                    'categoria' => 'Beneficios',
                    'descripcion' => 'Descuentos del 15% presentando póliza activa de La Caja, Sancor Seguros o Federación Patronal.',
                    'logo_url' => 'bx bx-shield-quarter',
                    'enlace' => '#',
                    'orden' => 8
                ]
            ];

            $insStmt = $pdo->prepare("INSERT INTO `sponsors` (`nombre`, `categoria`, `descripcion`, `logo_url`, `enlace`, `orden`) VALUES (:nom, :cat, :des, :log, :enl, :ord)");
            foreach ($defaultItems as $item) {
                $insStmt->execute([
                    ':nom' => $item['nombre'],
                    ':cat' => $item['categoria'],
                    ':des' => $item['descripcion'],
                    ':log' => $item['logo_url'],
                    ':enl' => $item['enlace'],
                    ':ord' => $item['orden']
                ]);
            }
        } else {
            // Verificar si existen los Socios Fundadores Black y Gold; si no, insertarlos
            $checkBlack = $pdo->query("SELECT COUNT(*) FROM `sponsors` WHERE `nombre` LIKE '%Socio Fundador Black%'")->fetchColumn();
            if ($checkBlack == 0) {
                $insStmt = $pdo->prepare("INSERT INTO `sponsors` (`nombre`, `categoria`, `descripcion`, `logo_url`, `enlace`, `orden`) VALUES (:nom, :cat, :des, :log, :enl, :ord)");
                $insStmt->execute([
                    ':nom' => 'Socio Fundador Black',
                    ':cat' => 'Socio Fundador',
                    ':des' => 'Acceso prioritario VIP #1 en Pit Lane sin fila, 30% OFF en todos los lavados y encerado cerámico sin cargo.',
                    ':log' => 'bx bx-crown',
                    ':enl' => 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Black',
                    ':ord' => 1
                ]);
            }

            $checkGold = $pdo->query("SELECT COUNT(*) FROM `sponsors` WHERE `nombre` LIKE '%Socio Fundador Gold%'")->fetchColumn();
            if ($checkGold == 0) {
                $insStmt = $pdo->prepare("INSERT INTO `sponsors` (`nombre`, `categoria`, `descripcion`, `logo_url`, `enlace`, `orden`) VALUES (:nom, :cat, :des, :log, :enl, :ord)");
                $insStmt->execute([
                    ':nom' => 'Socio Fundador Gold',
                    ':cat' => 'Socio Fundador',
                    ':des' => 'Atención preferencial en boxes, 20% OFF en todos los lavados y obsequio de perfumería en cada visita.',
                    ':log' => 'bx bxs-award',
                    ':enl' => 'https://wa.me/5491123456789?text=Hola,%20quiero%20ser%20Socio%20Fundador%20Gold',
                    ':ord' => 2
                ]);
            }
        }
    } catch (Exception $e) {
        // Continuar
    }
}

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
