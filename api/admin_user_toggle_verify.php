<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if ($id <= 0) json_err('Invalid id', 400);

$st = $pdo->prepare("SELECT is_verified FROM users WHERE id=? LIMIT 1");
$st->execute([$id]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('User not found', 404);

$new = ((int)$row['is_verified']) ? 0 : 1;
$up = $pdo->prepare("UPDATE users SET is_verified=? WHERE id=?");
$up->execute([$new, $id]);

json_ok(['id' => $id, 'is_verified' => $new]);
