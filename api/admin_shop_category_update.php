<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();

$id = (int)($in['id'] ?? 0);
$name = trim((string)($in['name'] ?? ''));
$slug = trim((string)($in['slug'] ?? ''));
$page_url = trim((string)($in['page_url'] ?? ''));
$image_url = trim((string)($in['image_url'] ?? ''));
$sort = (int)($in['sort'] ?? 0);
$is_active = !empty($in['is_active']) ? 1 : 0;

if ($id <= 0) {
    json_err('bad id', 422);
}

if ($name === '') {
    json_err('name required', 422);
}

if ($slug === '') {
    json_err('slug required', 422);
}

if (!preg_match('/^[a-z0-9_-]{1,80}$/', $slug)) {
    json_err('invalid slug', 422);
}

if ($page_url === '') {
    $page_url = '/shop_category.html?slug=' . $slug;
}

try {
    $stDup = $pdo->prepare('SELECT id FROM shop_categories WHERE slug = ? AND id <> ? LIMIT 1');
    $stDup->execute([$slug, $id]);
    if ($stDup->fetch()) {
        json_err('slug already exists', 409);
    }

    $sql = "
        UPDATE shop_categories
        SET
            name = ?,
            slug = ?,
            page_url = ?,
            image_url = ?,
            sort = ?,
            is_active = ?,
            updated_at = NOW()
        WHERE id = ?
    ";

    $st = $pdo->prepare($sql);
    $st->execute([
        $name,
        $slug,
        $page_url,
        $image_url,
        $sort,
        $is_active,
        $id,
    ]);

    json_ok([
        'id' => $id,
        'updated' => $st->rowCount(),
    ]);
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
