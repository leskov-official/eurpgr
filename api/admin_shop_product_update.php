<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();

$id = (int)($in['id'] ?? 0);
$category_id = (int)($in['category_id'] ?? 0);
$name = trim((string)($in['name'] ?? ''));
$sku = trim((string)($in['sku'] ?? ''));
$price_cents = (int)($in['price_cents'] ?? 0);
$pack_label = trim((string)($in['pack_label'] ?? ''));
$image_url = trim((string)($in['image_url'] ?? ''));
$description = trim((string)($in['description'] ?? ''));
$shelf_life_days = (int)($in['shelf_life_days'] ?? 0);
$storage_temp = trim((string)($in['storage_temp'] ?? ''));
$ingredients = $in['ingredients'] ?? [];
$nutrition = $in['nutrition_per_100g'] ?? [];
$variants = $in['variants'] ?? [];
$sort = (int)($in['sort'] ?? 0);
$is_active = !empty($in['is_active']) ? 1 : 0;

if ($id <= 0) {
    json_err('id required', 422);
}

if ($category_id <= 0) {
    json_err('category_id required', 422);
}

if ($name === '') {
    json_err('name required', 422);
}

$storage = shop_product_payload_to_storage($pdo, $ingredients, $nutrition, $variants);
$variantsDecoded = json_decode($storage['variants'] ?? $storage['variants_json'] ?? '[]', true);
if ($price_cents <= 0 && empty($variantsDecoded)) {
    json_err('price_cents required (or provide variants)', 422);
}

try {
    $sql = "
        UPDATE shop_products
        SET
            category_id = ?,
            name = ?,
            sku = ?,
            price_cents = ?,
            pack_label = ?,
            image_url = ?,
            description = ?,
            shelf_life_days = ?,
            storage_temp = ?,
            ingredients = ?,
            nutrition_per_100g = ?,
            variants = ?,
            ingredients_json = ?,
            nutrition_json = ?,
            variants_json = ?,
            sort = ?,
            is_active = ?,
            updated_at = NOW()
        WHERE id = ?
    ";

    $ingredientsValue = $storage['ingredients'] ?? $storage['ingredients_json'] ?? '[]';
    $nutritionValue = $storage['nutrition_per_100g'] ?? $storage['nutrition_json'] ?? '[]';
    $variantsValue = $storage['variants'] ?? $storage['variants_json'] ?? '[]';

    $st = $pdo->prepare($sql);
    $st->execute([
        $category_id,
        $name,
        $sku,
        $price_cents,
        $pack_label,
        $image_url,
        $description,
        $shelf_life_days,
        $storage_temp,
        $ingredientsValue,
        $nutritionValue,
        $variantsValue,
        $ingredientsValue,
        $nutritionValue,
        $variantsValue,
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
