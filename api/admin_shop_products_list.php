<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$category_id = (int)($_GET['category_id'] ?? 0);

if ($category_id <= 0) {
    json_ok([
        'products' => [],
    ]);
    exit;
}

function decode_json_array($value): array {
    if (is_array($value)) {
        return $value;
    }

    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    $sql = "
        SELECT
            id,
            category_id,
            name,
            sku,
            price_cents,
            pack_label,
            image_url,
            description,
            shelf_life_days,
            storage_temp,
            ingredients,
            nutrition_per_100g,
            variants,
            ingredients_json,
            nutrition_json,
            variants_json,
            sort,
            is_active,
            created_at,
            updated_at
        FROM shop_products
        WHERE category_id = ?
        ORDER BY sort ASC, id ASC
    ";

    $st = $pdo->prepare($sql);
    $st->execute([$category_id]);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    $products = array_map(static function (array $row): array {
        return [
            'id' => (int)$row['id'],
            'category_id' => (int)$row['category_id'],
            'name' => (string)$row['name'],
            'sku' => (string)($row['sku'] ?? ''),
            'price_cents' => (int)($row['price_cents'] ?? 0),
            'pack_label' => (string)($row['pack_label'] ?? ''),
            'image_url' => (string)($row['image_url'] ?? ''),
            'description' => (string)($row['description'] ?? ''),
            'shelf_life_days' => (int)($row['shelf_life_days'] ?? 0),
            'storage_temp' => (string)($row['storage_temp'] ?? ''),
            'ingredients' => decode_json_array(($row['ingredients'] ?? '') !== '' ? ($row['ingredients'] ?? '[]') : ($row['ingredients_json'] ?? '[]')),
            'nutrition_per_100g' => decode_json_array(($row['nutrition_per_100g'] ?? '') !== '' ? ($row['nutrition_per_100g'] ?? '[]') : ($row['nutrition_json'] ?? '[]')),
            'variants' => shop_normalize_variants(($row['variants'] ?? '') !== '' ? ($row['variants'] ?? '[]') : ($row['variants_json'] ?? '[]')),
            'sort' => (int)($row['sort'] ?? 0),
            'is_active' => (int)($row['is_active'] ?? 0),
            'created_at' => (string)($row['created_at'] ?? ''),
            'updated_at' => (string)($row['updated_at'] ?? ''),
        ];
    }, $rows);

    json_ok([
        'products' => $products,
    ]);
    exit;
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
    exit;
}
