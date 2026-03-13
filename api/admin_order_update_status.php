<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
$status = trim((string)($body['status'] ?? ''));

if ($id <= 0) json_err('Invalid id', 400);
if (!in_array($status, ['new','processing','done','cancelled'], true)) json_err('Invalid status', 400);

$st = $pdo->prepare("UPDATE orders SET status=? WHERE id=?");
$st->execute([$status, $id]);
if ($st->rowCount() === 0) {
  $chk = $pdo->prepare("SELECT id FROM orders WHERE id=? LIMIT 1");
  $chk->execute([$id]);
  if (!$chk->fetch()) json_err('Order not found', 404);
}

json_ok(['id' => $id, 'status' => $status]);
