<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

try {
    $sql = "
        SELECT
            id,
            name,
            slug,
            page_url,
            image_url,
            sort,
            is_active,
            created_at,
            updated_at
        FROM shop_categories
        ORDER BY sort ASC, id ASC
    ";

    $st = $pdo->query($sql);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    json_ok([
        'categories' => array_map(static function (array $row): array {
            return [
                'id' => (int)($row['id'] ?? 0),
                'name' => (string)($row['name'] ?? ''),
                'slug' => (string)($row['slug'] ?? ''),
                'page_url' => (string)($row['page_url'] ?? ''),
                'image_url' => (string)($row['image_url'] ?? ''),
                'sort' => (int)($row['sort'] ?? 0),
                'is_active' => (int)($row['is_active'] ?? 0),
                'created_at' => (string)($row['created_at'] ?? ''),
                'updated_at' => (string)($row['updated_at'] ?? ''),
            ];
        }, $rows),
    ]);
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
