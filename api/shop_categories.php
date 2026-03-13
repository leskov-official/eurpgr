<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

try {
  $st = $pdo->query("SELECT id, name, slug, page_url, image_url, sort
                     FROM shop_categories
                     WHERE is_active=1
                     ORDER BY sort ASC, id ASC");
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);
  foreach ($rows as &$r) {
    $r['id'] = (int)$r['id'];
    $r['sort'] = (int)$r['sort'];
    if (!isset($r['page_url']) || trim((string)$r['page_url']) === '') {
      $r['page_url'] = 'shop_category.html?category=' . (string)$r['slug'];
    }
  }
  unset($r);
  json_ok(['categories' => $rows]);
} catch (Throwable $e) {
  // If tables don't exist yet, return ok:false with gentle message (front-end can fallback)
  json_err('Shop not installed', 501);
}
