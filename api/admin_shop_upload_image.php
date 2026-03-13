<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'No file uploaded']);
  exit;
}

$dir = dirname(__DIR__) . '/images/uploads/shop';
if (!is_dir($dir)) {
  mkdir($dir, 0775, true);
}

$orig = (string)$_FILES['file']['name'];
$tmp  = (string)$_FILES['file']['tmp_name'];

$ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Unsupported file type']);
  exit;
}

$base = date('Ymd_His') . '_' . bin2hex(random_bytes(6));
$name = $base . '.' . $ext;
$dest = $dir . '/' . $name;

if (!move_uploaded_file($tmp, $dest)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Failed to save file']);
  exit;
}

$url = '/images/uploads/shop/' . $name;

echo json_encode([
  'ok' => true,
  'url' => $url,
]);
