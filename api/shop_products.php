<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (!function_exists('shop_normalize_variants')) {
  function shop_normalize_variants($v): array {
    if (is_string($v)) {
      $trimmed = trim($v);
      if ($trimmed === '') {
        return [];
      }
      $dec = json_decode($trimmed, true);
      if (is_array($dec)) {
        $v = $dec;
      } else {
        return [];
      }
    }

    if (!is_array($v)) {
      return [];
    }

    $out = [];
    foreach ($v as $row) {
      if (!is_array($row)) {
        continue;
      }

      $pack = is_array($row['pack'] ?? null) ? $row['pack'] : [];
      $grams = (int)($pack['grams'] ?? $row['grams'] ?? $row['weight_g'] ?? 0);
      $pieces = (int)($pack['pieces'] ?? $row['pieces'] ?? $row['qty'] ?? 0);
      $label = trim((string)($pack['label'] ?? $row['pack_label'] ?? $row['label'] ?? $row['name'] ?? ''));
      $sku = trim((string)($row['sku'] ?? ''));
      $price = (float)($row['price'] ?? $row['price_eur'] ?? 0);

      if ($price <= 0 && isset($row['price_cents'])) {
        $price = ((int)$row['price_cents']) / 100;
      }

      if ($label === '') {
        $parts = [];
        if ($pieces > 0) $parts[] = $pieces . 'tk';
        if ($grams > 0) $parts[] = $grams . 'g';
        $label = $parts ? '(' . implode(', ', $parts) . ')' : '';
      }

      $id = trim((string)($row['id'] ?? ''));
      if ($id === '') {
        $id = ($pieces ?: 0) . 'tk-' . ($grams ?: 0) . 'g-' . substr(sha1($label . '|' . $price . '|' . $sku), 0, 6);
      }

      if ($label === '' && $sku === '' && $price <= 0 && $grams <= 0 && $pieces <= 0) {
        continue;
      }

      $out[] = [
        'id' => $id,
        'sku' => $sku,
        'price' => $price,
        'pack' => [
          'grams' => $grams,
          'pieces' => $pieces,
          'label' => $label,
        ],
      ];
    }

    return array_values($out);
  }
}

$category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
$slug = isset($_GET['category']) ? trim((string)$_GET['category']) : '';
if ($slug === '' && isset($_GET['cat'])) {
  $slug = trim((string)$_GET['cat']);
}
$page_url = isset($_GET['page_url']) ? trim((string)$_GET['page_url']) : '';
if ($page_url === '' && $slug !== '') {
  $page_url = 'shop_category.html?category=' . $slug;
}

try {
  $category = null;

  if ($category_id <= 0 && $slug !== '') {
    $stC = $pdo->prepare("SELECT id, name, slug FROM shop_categories WHERE slug = ? AND is_active = 1 LIMIT 1");
    $stC->execute([$slug]);
    $category = $stC->fetch(PDO::FETCH_ASSOC) ?: null;
    $category_id = (int)($category['id'] ?? 0);
  }

  if ($category_id <= 0 && $page_url !== '') {
    $stC = $pdo->prepare("SELECT id, name, slug FROM shop_categories WHERE (page_url = ? OR page_url = ?) AND is_active = 1 LIMIT 1");
    $stC->execute([$page_url, ltrim($page_url, '/')]);
    $category = $stC->fetch(PDO::FETCH_ASSOC) ?: null;
    $category_id = (int)($category['id'] ?? 0);
  }

  if ($category_id <= 0) {
    json_err('category_id or category or page_url required', 422);
  }

  if ($category === null) {
    $stC = $pdo->prepare("SELECT id, name, slug FROM shop_categories WHERE id = ? LIMIT 1");
    $stC->execute([$category_id]);
    $category = $stC->fetch(PDO::FETCH_ASSOC) ?: null;
  }

  $useCanonical = false;
  try {
    $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
    $stCol = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $stCol->execute([$dbName, 'shop_products', 'ingredients']);
    $useCanonical = (int)$stCol->fetchColumn() > 0;
  } catch (Throwable $e) {
    $useCanonical = false;
  }

  $extraCols = $useCanonical
    ? 'ingredients, nutrition_per_100g, variants'
    : 'ingredients_json, nutrition_json, variants_json';

  $st = $pdo->prepare("
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
      $extraCols,
      sort
    FROM shop_products
    WHERE category_id = ? AND is_active = 1
    ORDER BY sort ASC, id ASC
  ");
  $st->execute([$category_id]);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  foreach ($rows as &$r) {
    $r['id'] = (int)$r['id'];
    $r['category_id'] = (int)$r['category_id'];
    $r['price_cents'] = (int)$r['price_cents'];
    $r['shelf_life_days'] = (int)($r['shelf_life_days'] ?? 0);
    $r['sort'] = (int)$r['sort'];

    $ingKey = $useCanonical ? 'ingredients' : 'ingredients_json';
    $nutKey = $useCanonical ? 'nutrition_per_100g' : 'nutrition_json';
    $varKey = $useCanonical ? 'variants' : 'variants_json';

    $srcIngredients = $r[$ingKey] ?? null;
    $srcNutrition = $r[$nutKey] ?? null;
    $srcVariants = $r[$varKey] ?? null;

    $decodeField = static function ($val): array {
      if (is_string($val) && trim($val) !== '') {
        $dec = json_decode($val, true);
        if (is_array($dec)) {
          return $dec;
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($val)) ?: [];
        $out = [];
        foreach ($lines as $ln) {
          $ln = trim((string)$ln);
          if ($ln !== '') {
            $out[] = $ln;
          }
        }
        return $out;
      }

      return is_array($val) ? $val : [];
    };

    $r['ingredients'] = $decodeField($srcIngredients);
    $r['nutrition_per_100g'] = $decodeField($srcNutrition);
    $r['variants'] = shop_normalize_variants($srcVariants);

    if (!$useCanonical) {
      unset($r['ingredients_json'], $r['nutrition_json'], $r['variants_json']);
    }

    if (!isset($r['variants']) || !is_array($r['variants']) || count($r['variants']) === 0) {
      $price = (int)($r['price_cents'] ?? 0);
      $label = trim((string)($r['pack_label'] ?? ''));

      if ($label !== '' || $price > 0) {
        $r['variants'] = [[
          'id' => 'base',
          'sku' => (string)($r['sku'] ?? ''),
          'price' => $price / 100.0,
          'pack' => [
            'grams' => 0,
            'pieces' => 0,
            'label' => $label,
          ],
        ]];
      }
    }
  }
  unset($r);

  if (is_array($category)) {
    $category['id'] = (int)$category['id'];
  }

  json_ok([
    'category' => $category,
    'products' => $rows,
  ]);
} catch (Throwable $e) {
  json_err('Shop error: ' . $e->getMessage(), 500);
}
