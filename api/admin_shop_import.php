<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();

if (!$in) {
    json_err('invalid json', 422);
}

$categories = $in['categories'] ?? [];
$products = $in['products'] ?? [];

if (!is_array($categories)) {
    $categories = [];
}
if (!is_array($products)) {
    $products = [];
}

function slugify_import(string $value): string {
    $value = mb_strtolower(trim($value), 'UTF-8');
    $map = [
        'ä' => 'a', 'ö' => 'o', 'õ' => 'o', 'ü' => 'u',
        'š' => 's', 'ž' => 'z',
    ];
    $value = strtr($value, $map);
    $value = preg_replace('/[^a-z0-9 _-]+/u', '', $value) ?? '';
    $value = preg_replace('/\s+/u', '-', $value) ?? '';
    $value = preg_replace('/-+/u', '-', $value) ?? '';
    $value = trim($value, '-_');
    return substr($value, 0, 80);
}

try {
    $pdo->beginTransaction();

    $createdCategories = 0;
    $updatedCategories = 0;
    $createdProducts = 0;
    $updatedProducts = 0;

    $catIdBySlug = [];

    $stCatBySlug = $pdo->prepare('SELECT id FROM shop_categories WHERE slug = ? LIMIT 1');
    $stCatInsert = $pdo->prepare("
        INSERT INTO shop_categories (
            name, slug, page_url, image_url, sort, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stCatUpdate = $pdo->prepare("
        UPDATE shop_categories
        SET name = ?, page_url = ?, image_url = ?, sort = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
    ");

    foreach ($categories as $row) {
        if (!is_array($row)) {
            continue;
        }

        $name = trim((string)($row['name'] ?? ''));
        $slug = trim((string)($row['slug'] ?? ''));
        $page_url = trim((string)($row['page_url'] ?? ''));
        $image_url = trim((string)($row['image_url'] ?? ''));
        $sort = (int)($row['sort'] ?? 0);
        $is_active = !empty($row['is_active']) ? 1 : 0;

        if ($name === '') {
            continue;
        }
        if ($slug === '') {
            $slug = slugify_import($name);
        }
        if ($slug === '') {
            continue;
        }
        if ($page_url === '') {
            $page_url = '/shop_category.html?slug=' . $slug;
        }

        $stCatBySlug->execute([$slug]);
        $existingId = (int)($stCatBySlug->fetchColumn() ?: 0);

        if ($existingId > 0) {
            $stCatUpdate->execute([$name, $page_url, $image_url, $sort, $is_active, $existingId]);
            $catIdBySlug[$slug] = $existingId;
            $updatedCategories++;
        } else {
            $stCatInsert->execute([$name, $slug, $page_url, $image_url, $sort, $is_active]);
            $newId = (int)$pdo->lastInsertId();
            $catIdBySlug[$slug] = $newId;
            $createdCategories++;
        }
    }

    $stProductBySku = $pdo->prepare('SELECT id FROM shop_products WHERE sku = ? LIMIT 1');
    $stProductInsert = $pdo->prepare("
        INSERT INTO shop_products (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $stProductUpdate = $pdo->prepare("
        UPDATE shop_products
        SET
            category_id = ?,
            name = ?,
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
    ");

    foreach ($products as $row) {
        if (!is_array($row)) {
            continue;
        }

        $name = trim((string)($row['name'] ?? ''));
        $sku = trim((string)($row['sku'] ?? ''));
        $price_cents = (int)($row['price_cents'] ?? 0);
        $pack_label = trim((string)($row['pack_label'] ?? ''));
        $image_url = trim((string)($row['image_url'] ?? ''));
        $description = trim((string)($row['description'] ?? ''));
        $shelf_life_days = (int)($row['shelf_life_days'] ?? 0);
        $storage_temp = trim((string)($row['storage_temp'] ?? ''));
        $sort = (int)($row['sort'] ?? 0);
        $is_active = !empty($row['is_active']) ? 1 : 0;

        $category_id = (int)($row['category_id'] ?? 0);
        $category_slug = trim((string)($row['category_slug'] ?? ''));

        if ($category_id <= 0 && $category_slug !== '') {
            if (isset($catIdBySlug[$category_slug])) {
                $category_id = (int)$catIdBySlug[$category_slug];
            } else {
                $stCatBySlug->execute([$category_slug]);
                $category_id = (int)($stCatBySlug->fetchColumn() ?: 0);
            }
        }

        if ($category_id <= 0 || $name === '') {
            continue;
        }

        $storage = shop_product_payload_to_storage(
            $pdo,
            $row['ingredients'] ?? [],
            $row['nutrition_per_100g'] ?? [],
            $row['variants'] ?? []
        );

        $ingredientsValue = $storage['ingredients'] ?? $storage['ingredients_json'] ?? '[]';
        $nutritionValue = $storage['nutrition_per_100g'] ?? $storage['nutrition_json'] ?? '[]';
        $variantsValue = $storage['variants'] ?? $storage['variants_json'] ?? '[]';

        if ($sku !== '') {
            $stProductBySku->execute([$sku]);
            $existingId = (int)($stProductBySku->fetchColumn() ?: 0);

            if ($existingId > 0) {
                $stProductUpdate->execute([
                    $category_id,
                    $name,
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
                    $existingId,
                ]);
                $updatedProducts++;
                continue;
            }
        }

        $stProductInsert->execute([
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
        ]);
        $createdProducts++;
    }

    $pdo->commit();

    json_ok([
        'categories_created' => $createdCategories,
        'categories_updated' => $updatedCategories,
        'products_created' => $createdProducts,
        'products_updated' => $updatedProducts,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_err('Import error: ' . $e->getMessage(), 500);
}
