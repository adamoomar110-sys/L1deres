<?php
// ============================================================
// AUTO-INSTALLER DE BASE DE DATOS MYSQL EN DONWEB (Aura v1.5)
// ============================================================
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$db_names = [
    'a0170001_lava2',
    'a0170001_lava',
    'a0170001_l1deres',
    'a0170001_lideres',
    'a0170001_aura',
    'a0170001_autowash',
    'a0170001_db',
    'a0170001_main'
];

$credentials = [
    ['user' => 'a0170001_l1deres', 'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001_l1deres', 'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001_lava2',   'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001_lava2',   'pass' => 'AuraFTP2025@aura'],
    ['user' => 'a0170001',         'pass' => '@Peloymago110Peloymago110'],
    ['user' => 'a0170001',         'pass' => 'AuraFTP2025@aura']
];

$pdo = null;
$logs = [];
$usedCred = null;
$connectedDb = null;

foreach ($db_names as $db_name) {
    foreach ($credentials as $cred) {
        try {
            $testPdo = new PDO("mysql:host={$host};dbname={$db_name};charset=utf8mb4", $cred['user'], $cred['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $pdo = $testPdo;
            $usedCred = $cred;
            $connectedDb = $db_name;
            $logs[] = "¡Conectado exitosamente a DB '{$db_name}' usando usuario '{$cred['user']}'!";
            break 2;
        } catch (PDOException $ex) {
            $logs[] = "Prueba DB '{$db_name}' usuario '{$cred['user']}': " . $ex->getMessage();
        }
    }
}

if (!$pdo) {
    echo json_encode([
        'success' => false,
        'error' => 'Aún no se pudo conectar. Haz clic en "Crear" o "Guardar" en el formulario de DonWeb.',
        'logs' => $logs
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Ejecutar DDL
$sql = "
DROP TABLE IF EXISTS `configuracion`;
CREATE TABLE `configuracion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `live_state` LONGTEXT NULL,
  `precio_express_auto` INT DEFAULT 12000,
  `precio_express_camioneta` INT DEFAULT 15000,
  `precio_completo_auto` INT DEFAULT 18000,
  `precio_completo_camioneta` INT DEFAULT 22000,
  `whatsapp_number` VARCHAR(50) DEFAULT '5491160473754',
  `dias_atencion` VARCHAR(100) DEFAULT 'Lunes a Sábados',
  `hora_apertura` VARCHAR(20) DEFAULT '08:00',
  `hora_cierre` VARCHAR(20) DEFAULT '20:00',
  `atiende_domingos` TINYINT(1) DEFAULT 0,
  `atiende_feriados` TINYINT(1) DEFAULT 0,
  `mensaje_feriados` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `configuracion` (`id`, `precio_express_auto`, `precio_express_camioneta`, `precio_completo_auto`, `precio_completo_camioneta`, `whatsapp_number`, `dias_atencion`, `hora_apertura`, `hora_cierre`)
VALUES (1, 10000, 12000, 15000, 18000, '5491160473754', 'Lunes a Sábados', '08:00', '20:00')
ON DUPLICATE KEY UPDATE `id` = 1;

CREATE TABLE IF NOT EXISTS `reservas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_nombre` VARCHAR(150) NOT NULL,
  `cliente_telefono` VARCHAR(50) NULL,
  `patente` VARCHAR(20) NOT NULL,
  `modelo_auto` VARCHAR(100) NULL,
  `tipo_servicio` VARCHAR(50) NOT NULL,
  `precio` DECIMAL(10,2) DEFAULT 0.00,
  `estado` VARCHAR(50) DEFAULT 'pendiente',
  `box_id` INT DEFAULT 0,
  `fecha_reserva` DATE NULL,
  `hora_reserva` TIME NULL,
  `notas` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promociones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `descuento` DECIMAL(5,2) DEFAULT 0.00,
  `activa` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sponsors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `logo_url` TEXT NULL,
  `enlace` TEXT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resenas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_nombre` VARCHAR(150) NOT NULL,
  `estrellas` INT DEFAULT 5,
  `comentario` TEXT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`email`, `password_hash`, `role`)
VALUES 
  ('admin@aura.com', '$2b$10$3JSBn5fFIFDmDY3/jzcN4ucL5EUlSHDFjDW8OajRc2hMAiGs0JD1G', 'admin'),
  ('empleado@aura.com', '$2b$10$3JSBn5fFIFDmDY3/jzcN4ucL5EUlSHDFjDW8OajRc2hMAiGs0JD1G', 'empleado'),
  ('claudia@l1deres.com', '$2b$10$3JSBn5fFIFDmDY3/jzcN4ucL5EUlSHDFjDW8OajRc2hMAiGs0JD1G', 'admin'),
  ('javier@l1deres.com', '$2b$10$3JSBn5fFIFDmDY3/jzcN4ucL5EUlSHDFjDW8OajRc2hMAiGs0JD1G', 'admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

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
    $logs[] = "¡Tablas creadas e inicializadas perfectamente en la base de datos '{$db_name}'!";
    echo json_encode(['success' => true, 'database' => $db_name, 'logs' => $logs], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'logs' => $logs], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
