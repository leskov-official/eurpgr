<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';

$admin = require_admin($pdo);

// Create tables if they do not exist.
// Note: MySQL/MariaDB compatible.
try {
  $pdo->exec("CREATE TABLE IF NOT EXISTS shop_categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    page_url VARCHAR(512) NOT NULL DEFAULT '',
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    sort INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_shop_categories_slug (slug),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS shop_products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(128) NOT NULL DEFAULT '',
    price_cents INT NOT NULL DEFAULT 0,
    pack_label VARCHAR(255) NOT NULL DEFAULT '',
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    description TEXT NULL,
    sort INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shop_products_cat (category_id, sort, id),
    PRIMARY KEY (id),
    CONSTRAINT fk_shop_products_cat FOREIGN KEY (category_id)
      REFERENCES shop_categories(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  // --- Migrations (add new columns if table existed before) ---
  $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
  $colExists = function(string $table, string $col) use ($pdo, $dbName): bool {
    $st = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
    $st->execute([$dbName, $table, $col]);
    return (int)$st->fetchColumn() > 0;
  };

  // Extended product fields used by site modal (optional)
  if ($colExists('shop_products', 'shelf_life_days') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN shelf_life_days INT NOT NULL DEFAULT 0 AFTER description');
  }
  if ($colExists('shop_products', 'storage_temp') === false) {
    $pdo->exec("ALTER TABLE shop_products ADD COLUMN storage_temp VARCHAR(128) NOT NULL DEFAULT '' AFTER shelf_life_days");
  }

  // Canonical column names (preferred)
  if ($colExists('shop_products', 'ingredients') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN ingredients TEXT NULL AFTER storage_temp');
  }
  if ($colExists('shop_products', 'nutrition_per_100g') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN nutrition_per_100g TEXT NULL AFTER ingredients');
  }
  if ($colExists('shop_products', 'variants') === false) {
    // JSON type is not always available on older MariaDB; use LONGTEXT.
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN variants LONGTEXT NULL AFTER nutrition_per_100g');
  }

  // Backward-compat (older installs that used *_json)
  if ($colExists('shop_products', 'ingredients_json') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN ingredients_json TEXT NULL AFTER variants');
  }
  if ($colExists('shop_products', 'nutrition_json') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN nutrition_json TEXT NULL AFTER ingredients_json');
  }
  if ($colExists('shop_products', 'variants_json') === false) {
    $pdo->exec('ALTER TABLE shop_products ADD COLUMN variants_json TEXT NULL AFTER nutrition_json');
  }

  json_ok([
    'message' => 'shop tables ready',
    'admin' => [ 'id' => $admin['id'], 'email' => $admin['email'] ],
  ]);
} catch (Throwable $e) {
  json_err('Install failed: ' . $e->getMessage(), 500);
}
