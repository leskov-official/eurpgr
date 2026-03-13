<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
require_once __DIR__ . '/site_content_lib.php';
require_admin($pdo);
$in = read_json_body();
ensure_site_content_schema($pdo);
$id = (int)($in['id'] ?? 0);
if ($id <= 0) json_err('Invalid id', 422);
$st = $pdo->prepare('DELETE FROM site_content_blocks WHERE id=? LIMIT 1');
$st->execute([$id]);
json_ok();
