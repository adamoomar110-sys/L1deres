<?php
// ============================================================
// FILE UPLOAD API - SPINAZ GARAGE (DONWEB)
// ============================================================
require_once __DIR__ . '/config.php';

$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        sendResponse(['error' => 'No se ha proporcionado ningún archivo'], 400);
    }

    $file = $_FILES['file'];
    $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9\._-]/', '', basename($file['name']));
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $publicUrl = "{$scheme}://{$host}/spinaz/uploads/{$fileName}";
        sendResponse(['success' => true, 'url' => $publicUrl, 'path' => $fileName]);
    } else {
        sendResponse(['error' => 'Falló la subida del archivo al servidor'], 500);
    }
}

sendResponse(['error' => 'Método no permitido'], 405);
