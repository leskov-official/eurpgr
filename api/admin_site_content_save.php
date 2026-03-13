<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
require_once __DIR__ . '/site_content_lib.php';
require_admin($pdo);
$in = read_json_body();
ensure_site_content_schema($pdo);
$id = (int)($in['id'] ?? 0);
$page_key = normalize_page_key((string)($in['page_key'] ?? 'home'));
$block_key = trim((string)($in['block_key'] ?? ''));
$block_type = trim((string)($in['block_type'] ?? 'section'));
$name = trim((string)($in['name'] ?? ''));
if ($block_key === '') json_err('block_key is required', 422);
if (!preg_match('~^[a-z0-9][a-z0-9_-]{1,119}$~', $block_key)) json_err('Invalid block_key', 422);
if (!in_array($block_type, ['section','hero_slide'], true)) json_err('Invalid block_type', 422);
$media_type = trim((string)($in['media_type'] ?? 'image')); if (!in_array($media_type, ['image','video'], true)) $media_type = 'image';
$payload = [$page_key,$block_key,$block_type,$name,trim((string)($in['eyebrow'] ?? '')),trim((string)($in['title'] ?? '')),(string)($in['content_html'] ?? ''),trim((string)($in['media_url'] ?? '')),$media_type,trim((string)($in['image_alt'] ?? '')),trim((string)($in['button_primary_label'] ?? '')),trim((string)($in['button_primary_url'] ?? '')),trim((string)($in['button_secondary_label'] ?? '')),trim((string)($in['button_secondary_url'] ?? '')),(int)($in['sort'] ?? 0),(int)($in['is_active'] ?? 1)];
if ($id > 0) {
  $st = $pdo->prepare('UPDATE site_content_blocks SET page_key=?, block_key=?, block_type=?, name=?, eyebrow=?, title=?, content_html=?, media_url=?, media_type=?, image_alt=?, button_primary_label=?, button_primary_url=?, button_secondary_label=?, button_secondary_url=?, sort=?, is_active=? WHERE id=? LIMIT 1');
  $st->execute([...$payload, $id]);
} else {
  $st = $pdo->prepare('INSERT INTO site_content_blocks (page_key, block_key, block_type, name, eyebrow, title, content_html, media_url, media_type, image_alt, button_primary_label, button_primary_url, button_secondary_label, button_secondary_url, sort, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  $st->execute($payload); $id = (int)$pdo->lastInsertId();
}
json_ok(['id'=>$id]);
