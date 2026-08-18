<?php
// ============================================================
// AUTO-INSTALLER DE BASE DE DATOS MYSQL EN DONWEB (SPINAZ GARAGE)
// ============================================================
require_once __DIR__ . '/config.php';

$logs = [];

$sql = "
CREATE TABLE IF NOT EXISTS `spinaz_profiles` (
  `id` VARCHAR(64) PRIMARY KEY,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'driver',
  `phone` VARCHAR(50) NULL,
  `dni` VARCHAR(30) NULL,
  `vehicle_id` VARCHAR(64) NULL,
  `metrics` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_vehicles` (
  `id` VARCHAR(64) PRIMARY KEY,
  `plate` VARCHAR(30) UNIQUE NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'active',
  `last_lat` DOUBLE NULL,
  `last_lng` DOUBLE NULL,
  `metrics` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_applicants` (
  `id` VARCHAR(64) PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `dni` VARCHAR(30) NOT NULL,
  `age` INT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `zone` VARCHAR(100) NULL,
  `app_experience` TEXT NULL,
  `accident_history` TEXT NULL,
  `has_professional_license` TINYINT(1) DEFAULT 0,
  `can_pay_advance` TINYINT(1) DEFAULT 0,
  `dni_front_url` TEXT NULL,
  `dni_back_url` TEXT NULL,
  `license_url` TEXT NULL,
  `selfie_url` TEXT NULL,
  `status` VARCHAR(30) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_payments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `driver_id` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `type` VARCHAR(30) DEFAULT 'payment',
  `status` VARCHAR(30) DEFAULT 'pending',
  `due_date` DATE NULL,
  `receipt_url` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_incidents` (
  `id` VARCHAR(64) PRIMARY KEY,
  `driver_id` VARCHAR(64) NULL,
  `vehicle_id` VARCHAR(64) NULL,
  `description` TEXT NOT NULL,
  `photo_url` TEXT NULL,
  `audio_url` TEXT NULL,
  `status` VARCHAR(30) DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_announcements` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_daily_reports` (
  `id` VARCHAR(64) PRIMARY KEY,
  `driver_id` VARCHAR(64) NOT NULL,
  `vehicle_id` VARCHAR(64) NULL,
  `start_km` INT NOT NULL,
  `end_km` INT NULL,
  `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL,
  `revenue` DECIMAL(10,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_benefits` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `location` VARCHAR(150) NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_service_orders` (
  `id` VARCHAR(64) PRIMARY KEY,
  `vehicle_id` VARCHAR(64) NULL,
  `plate` VARCHAR(30) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'taller', -- 'taller' | 'lubricentro' | 'lavadero'
  `provider_type` VARCHAR(50) NOT NULL DEFAULT 'taller',
  `description` TEXT NOT NULL,
  `status` VARCHAR(30) DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed'
  `cost` DECIMAL(10,2) DEFAULT 0.00,
  `budget` DECIMAL(10,2) DEFAULT 0.00,
  `appointment_date` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_chat_messages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `channel` VARCHAR(50) NOT NULL,
  `sender` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `spinaz_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $pdo->exec($sql);
    $logs[] = "¡Tablas 'spinaz_*' creadas exitosamente!";
    
    // Migraciones automáticas de columnas existentes
    $alterQueries = [
        "ALTER TABLE `spinaz_service_orders` ADD COLUMN IF NOT EXISTS `provider_type` VARCHAR(50) NOT NULL DEFAULT 'taller'",
        "ALTER TABLE `spinaz_service_orders` ADD COLUMN IF NOT EXISTS `budget` DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE `spinaz_service_orders` ADD COLUMN IF NOT EXISTS `appointment_date` VARCHAR(100) NULL"
    ];
    foreach ($alterQueries as $aq) {
        try {
            $pdo->exec($aq);
        } catch (Exception $ex) {
            // Ignorar si la versión de MySQL no soporta IF NOT EXISTS o ya existe
        }
    }
    
    // Seed Admin Default Users
    $defaultUsers = [
        ['id' => 'u-admin-01', 'email' => 'admin@spinazgarage.com', 'pass' => '123456', 'name' => 'Administrador Spinaz', 'role' => 'admin'],
        ['id' => 'u-admin-02', 'email' => 'claudio@spinaz.com', 'pass' => '123456', 'name' => 'Claudio Spinaz', 'role' => 'admin'],
        ['id' => 'u-admin-03', 'email' => 'omar@programador.com', 'pass' => '123456', 'name' => 'Omar Adamo', 'role' => 'admin'],
        ['id' => 'u-admin-04', 'email' => 'admin@spinaz.com', 'pass' => '123456', 'name' => 'Administrador Principal', 'role' => 'admin'],
        ['id' => 'u-driver-01', 'email' => 'chofer@spinazgarage.com', 'pass' => '123456', 'name' => 'Chofer de Prueba', 'role' => 'driver']
    ];
    
    $stmt = $pdo->prepare("INSERT INTO `spinaz_profiles` (`id`, `email`, `password_hash`, `full_name`, `role`) VALUES (:id, :email, :pass, :name, :role) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `role` = VALUES(`role`)");
    foreach ($defaultUsers as $u) {
        $hash = password_hash($u['pass'], PASSWORD_BCRYPT);
        $stmt->execute([':id' => $u['id'], ':email' => $u['email'], ':pass' => $hash, ':name' => $u['name'], ':role' => $u['role']]);
    }
    $logs[] = "¡Usuarios principales de Spinaz inicializados!";
    
    // Seed default settings
    $pdo->exec("INSERT INTO `spinaz_settings` (`setting_key`, `setting_value`) VALUES ('lavado_precio', '5000') ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`");

    sendResponse(['success' => true, 'logs' => $logs]);
} catch (Exception $e) {
    sendResponse(['success' => false, 'error' => $e->getMessage(), 'logs' => $logs], 500);
}
