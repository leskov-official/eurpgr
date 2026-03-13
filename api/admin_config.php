<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

const ADMIN_EMAILS = [
   'info@eurpgr.ee',
];

function admin_email_list(): array {
  $env = getenv('ADMIN_EMAILS');
  if (is_string($env) && trim($env) !== '') {
    $parts = array_filter(array_map('trim', explode(',', $env)));
    return array_values(array_unique(array_map('strtolower', $parts)));
  }
  return array_values(array_unique(array_map('strtolower', ADMIN_EMAILS)));
}

function require_admin(PDO $pdo): array {
  if (empty($_SESSION['user_id'])) {
    $cookie = $_COOKIE['remember'] ?? '';
    if (is_string($cookie) && strpos($cookie, ':') !== false) {
      [$selector, $token] = explode(':', $cookie, 2);
      $selector = trim($selector);
      $token = trim($token);
      if ($selector !== '' && $token !== '') {
        $st = $pdo->prepare("SELECT user_id, token_hash, expires_at FROM user_remember_tokens WHERE selector=? LIMIT 1");
        $st->execute([$selector]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if ($row && strtotime((string)$row['expires_at']) > time()) {
          $calc = hash('sha256', $token);
          if (hash_equals((string)$row['token_hash'], $calc)) {
            $_SESSION['user_id'] = (int)$row['user_id'];
          }
        }
      }
    }
  }

  if (empty($_SESSION['user_id'])) json_err('Not authenticated', 401);
  $uid = (int)$_SESSION['user_id'];

  $st = $pdo->prepare("SELECT id, email, first_name, last_name, phone, avatar_url, is_verified, created_at FROM users WHERE id=? LIMIT 1");
  $st->execute([$uid]);
  $u = $st->fetch(PDO::FETCH_ASSOC);
  if (!$u) json_err('User not found', 401);

  $email = strtolower((string)($u['email'] ?? ''));
  $admins = admin_email_list();
  if (!in_array($email, $admins, true)) json_err('Forbidden', 403);

  $u['id'] = (int)$u['id'];
  $u['is_verified'] = (int)($u['is_verified'] ?? 0);
  return $u;
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  if (!is_string($raw)) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

// --- Shop helpers (schema drift safe) ---
function db_column_exists(PDO $pdo, string $table, string $column): bool {
  $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
  $st = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
  $st->execute([$dbName, $table, $column]);
  return (int)$st->fetchColumn() > 0;
}

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

    $label = trim((string)(
      $pack['label']
      ?? $row['pack_label']
      ?? $row['label']
      ?? $row['name']
      ?? ''
    ));

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

function shop_product_payload_to_storage(PDO $pdo, $ingredients, $nutrition, $variants): array {
  $to_lines_array = function($v) use (&$to_lines_array): array {
    if (is_array($v)) {
      $out = [];
      foreach ($v as $x) {
        if ($x === null) continue;
        $s = trim((string)$x);
        if ($s !== '') $out[] = $s;
      }
      return $out;
    }

    $s = trim((string)($v ?? ''));
    if ($s === '') return [];

    if ($s[0] === '[' || $s[0] === '{') {
      $dec = json_decode($s, true);
      if (is_array($dec)) return $to_lines_array($dec);
    }

    $lines = preg_split('/\r\n|\r|\n/', $s) ?: [];
    $out = [];
    foreach ($lines as $ln) {
      $ln = trim((string)$ln);
      if ($ln !== '') $out[] = $ln;
    }
    return $out;
  };

  $ing = json_encode($to_lines_array($ingredients), JSON_UNESCAPED_UNICODE);
  $nut = json_encode($to_lines_array($nutrition), JSON_UNESCAPED_UNICODE);
  $var = json_encode(shop_normalize_variants($variants), JSON_UNESCAPED_UNICODE);

  $useCanonical = db_column_exists($pdo, 'shop_products', 'ingredients')
    && db_column_exists($pdo, 'shop_products', 'nutrition_per_100g')
    && db_column_exists($pdo, 'shop_products', 'variants');

  if ($useCanonical) {
    return [
      'ingredients' => $ing,
      'nutrition_per_100g' => $nut,
      'variants' => $var,
    ];
  }

  return [
    'ingredients_json' => $ing,
    'nutrition_json' => $nut,
    'variants_json' => $var,
  ];
}
