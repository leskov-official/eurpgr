<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$body = read_json_body();
$rel = (string)($body['rel'] ?? '');
$rel = str_replace('\\', '/', $rel);
$rel = ltrim($rel, '/');

if ($rel === '' || str_contains($rel, '..')) json_err('Invalid path', 400);

$base = realpath(__DIR__ . '/../uploads');
if (!$base || !is_dir($base)) json_err('Uploads dir missing', 500);

$target = realpath($base . '/' . $rel);
if (!$target) json_err('File not found', 404);
if (!str_starts_with($target, $base)) json_err('Forbidden', 403);
if (!is_file($target)) json_err('Not a file', 400);

if (!unlink($target)) json_err('Delete failed', 500);

json_ok(['deleted' => $rel]);
