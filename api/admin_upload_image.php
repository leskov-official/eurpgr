<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
$admin = require_admin($pdo);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }
if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'No file uploaded']); exit; }
$file = $_FILES['file'];
$orig = (string)($file['name'] ?? '');
$tmp = (string)($file['tmp_name'] ?? '');
$size = (int)($file['size'] ?? 0);
$ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
$allowed = [
  'jpg' => ['mime' => ['image/jpeg'], 'kind' => 'image', 'max' => 8 * 1024 * 1024],
  'jpeg' => ['mime' => ['image/jpeg'], 'kind' => 'image', 'max' => 8 * 1024 * 1024],
  'png' => ['mime' => ['image/png'], 'kind' => 'image', 'max' => 8 * 1024 * 1024],
  'webp' => ['mime' => ['image/webp'], 'kind' => 'image', 'max' => 8 * 1024 * 1024],
  'gif' => ['mime' => ['image/gif'], 'kind' => 'image', 'max' => 12 * 1024 * 1024],
  'mp4' => ['mime' => ['video/mp4','application/mp4'], 'kind' => 'video', 'max' => 25 * 1024 * 1024],
];
if (!isset($allowed[$ext])) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'Unsupported file type']); exit; }
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$finfo->file($tmp);
if (!in_array($mime, $allowed[$ext]['mime'], true)) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'Unexpected MIME type']); exit; }
if ($size <= 0 || $size > $allowed[$ext]['max']) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'File is too large']); exit; }
$subdir = $allowed[$ext]['kind'] === 'video' ? 'site-media' : 'shop';
$dir = dirname(__DIR__) . '/images/uploads/' . $subdir;
if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Upload directory error']); exit; }
$base = date('Ymd_His') . '_' . bin2hex(random_bytes(6));
$name = $base . '.' . $ext;
$dest = $dir . '/' . $name;
if (!move_uploaded_file($tmp, $dest)) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Failed to save file']); exit; }
$url = '/images/uploads/' . $subdir . '/' . $name;
echo json_encode(['ok'=>true,'url'=>$url,'image_url'=>$url,'media_type'=>$allowed[$ext]['kind']], JSON_UNESCAPED_SLASHES);
