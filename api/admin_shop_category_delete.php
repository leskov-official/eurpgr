<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();
$id = (int)($in['id'] ?? 0);
if ($id <= 0) json_err('Bad id', 422);

try {
  $st = $pdo->prepare("DELETE FROM shop_categories WHERE id=?");
  $st->execute([$id]);
  json_ok(['deleted' => $st->rowCount()]);
} catch (Throwable $e) {
  json_err('DB error: ' . $e->getMessage(), 500);
}
