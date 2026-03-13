<?php
require __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) json_err('Pole autentitud', 401);
$uid = (int)$_SESSION['user_id'];

$st = $pdo->prepare("
  SELECT id, status, total_cents, currency, payment_method, shipping_method, shipping_text, created_at
  FROM orders
  WHERE user_id = ?
  ORDER BY id DESC
  LIMIT 50
");
$st->execute([$uid]);
$orders = $st->fetchAll();

$it = $pdo->prepare("
  SELECT product_name, qty, price_cents, line_total_cents
  FROM order_items
  WHERE order_id = ?
  ORDER BY id ASC
");

foreach ($orders as &$o) {
  $it->execute([(int)$o['id']]);
  $o['items'] = $it->fetchAll();
}
unset($o);

json_ok(['orders' => $orders]);
