<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
require_once __DIR__ . '/site_content_lib.php';
require_admin($pdo);
$in = read_json_body();
ensure_site_content_schema($pdo);
$items = $in['items'] ?? [];
if (!is_array($items) || !$items) json_err('items required', 422);
$st = $pdo->prepare('UPDATE site_content_blocks SET sort=? WHERE id=? LIMIT 1');
foreach ($items as $row) {
  if (!is_array($row)) continue;
  $st->execute([(int)($row['sort'] ?? 0), (int)($row['id'] ?? 0)]);
}
json_ok();
