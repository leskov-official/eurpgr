<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();
$category_id = (int)($in['category_id'] ?? 0);
$ordered = $in['ordered_ids'] ?? null;

if ($category_id <= 0) json_err('category_id required', 422);
if (!is_array($ordered) || count($ordered) < 1) json_err('ordered_ids required', 422);

try {
  $pdo->beginTransaction();
  $st = $pdo->prepare('UPDATE shop_products SET sort=? WHERE id=? AND category_id=?');
  $sort = 1;
  foreach ($ordered as $id) {
    $pid = (int)$id;
    if ($pid <= 0) continue;
    $st->execute([$sort++, $pid, $category_id]);
  }
  $pdo->commit();
  json_ok(['updated' => $sort - 1]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  json_err('DB error: ' . $e->getMessage(), 500);
}
