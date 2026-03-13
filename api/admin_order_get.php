<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_err('Invalid id', 400);

$st = $pdo->prepare("SELECT * FROM orders WHERE id=? LIMIT 1");
$st->execute([$id]);
$o = $st->fetch(PDO::FETCH_ASSOC);
if (!$o) json_err('Order not found', 404);

$o['id'] = (int)$o['id'];
$o['user_id'] = $o['user_id'] !== null ? (int)$o['user_id'] : null;
$o['total_cents'] = (int)$o['total_cents'];

$stI = $pdo->prepare("SELECT id, order_id, product_id, product_name, qty, price_cents, line_total_cents FROM order_items WHERE order_id=? ORDER BY id ASC");
$stI->execute([$id]);
$items = $stI->fetchAll(PDO::FETCH_ASSOC) ?: [];
foreach ($items as &$it) {
  $it['id'] = (int)$it['id'];
  $it['order_id'] = (int)$it['order_id'];
  $it['qty'] = (int)$it['qty'];
  $it['price_cents'] = (int)$it['price_cents'];
  $it['line_total_cents'] = (int)$it['line_total_cents'];
}

json_ok(['order' => $o, 'items' => $items]);
