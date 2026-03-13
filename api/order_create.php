<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

register_shutdown_function(function (): void {
  $e = error_get_last();
  if (!$e || !in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
    return;
  }

  if (!headers_sent()) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
  }

  echo json_encode([
    'ok' => false,
    'error' => 'Serveri sisemine viga',
  ], JSON_UNESCAPED_UNICODE);
  exit;
});

require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
  @session_start();
}

$mailer_ok = true;
try {
  require_once __DIR__ . '/mailer.php';
} catch (Throwable $e) {
  $mailer_ok = false;
  error_log('[order_create] mailer.php load failed: ' . $e->getMessage());
}

if (!function_exists('json_error') && function_exists('json_err')) {
  function json_error(string $msg, int $code = 400): void { json_err($msg, $code); }
}
if (!function_exists('json_ok') && function_exists('json_ok')) {
  
}
if (!function_exists('json_error') && !function_exists('json_err')) {
  function json_error(string $msg, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'error'=>$msg], JSON_UNESCAPED_UNICODE);
    exit;
  }
}
if (!function_exists('json_ok')) {
  function json_ok(array $data = []): void {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>true] + $data, JSON_UNESCAPED_UNICODE);
    exit;
  }
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) json_error('Bad JSON', 400);

$first_name = trim((string)($data['first_name'] ?? ''));
$last_name  = trim((string)($data['last_name'] ?? ''));
$phone      = trim((string)($data['phone'] ?? ''));
$email      = strtolower(trim((string)($data['email'] ?? '')));
$notes      = trim((string)($data['notes'] ?? ''));
$shipping_method = trim((string)($data['shipping_method'] ?? 'pickup'));
$shipping_text   = trim((string)($data['shipping_text'] ?? ''));
$payment_method  = trim((string)($data['payment_method'] ?? ''));
$total_cents     = (int)($data['total_cents'] ?? 0);
$allowed_shipping_methods = ['pickup','courier'];
$allowed_payment_methods = ['swedbank','seb','lhv','luminor','coop','revolut','paysera','wise','n26','kniks'];
$items           = $data['items'] ?? [];

$create_account  = !empty($data['create_account']);
$password        = (string)($data['password'] ?? '');

if ($first_name === '') json_error('Eesnimi on kohustuslik', 422);
if ($last_name === '') json_error('Perekonnanimi on kohustuslik', 422);
if ($phone === '') json_error('Telefon on kohustuslik', 422);
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_error('E-posti aadress on vigane', 422);
if (!in_array($shipping_method, $allowed_shipping_methods, true)) json_error('Tarneviis on vigane', 422);
if (!in_array($payment_method, $allowed_payment_methods, true)) json_error('Makseviis on vigane', 422);
if ($total_cents <= 0) json_error('Summa on vigane', 422);
if (!is_array($items) || !count($items)) json_error('Ostukorv on tühi', 422);
if (count($items) > 100) json_error('Ostukorvis on liiga palju ridu', 422);

if ($create_account && strlen($password) < 8) {
  json_error('Parool peab olema vähemalt 8 tähemärki', 422);
}


function normalize_shop_variants($src): array {
  if (is_string($src)) {
    $src = trim($src);
    if ($src === '') return [];
    $dec = json_decode($src, true);
    if (is_array($dec)) $src = $dec; else return [];
  }
  if (!is_array($src)) return [];

  $out = [];
  foreach ($src as $row) {
    if (!is_array($row)) continue;
    $pack = is_array($row['pack'] ?? null) ? $row['pack'] : [];
    $label = trim((string)($pack['label'] ?? $row['pack_label'] ?? $row['label'] ?? $row['name'] ?? ''));
    $sku = trim((string)($row['sku'] ?? ''));
    $priceCents = (int)($row['price_cents'] ?? 0);
    if ($priceCents <= 0) {
      $price = (float)($row['price'] ?? $row['price_eur'] ?? 0);
      $priceCents = (int)round($price * 100);
    }
    $out[] = [
      'label' => $label,
      'sku' => $sku,
      'price_cents' => $priceCents,
    ];
  }
  return $out;
}

function resolve_product_price_cents(PDO $pdo, int $productId, string $sku = '', string $packLabel = ''): ?int {
  if ($productId <= 0) return null;

  $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
  $stCol = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?');
  $stCol->execute([$dbName, 'shop_products', 'variants']);
  $useCanonical = (int)$stCol->fetchColumn() > 0;
  $variantCol = $useCanonical ? 'variants' : 'variants_json';

  $st = $pdo->prepare("SELECT price_cents, pack_label, sku, $variantCol AS variants_src FROM shop_products WHERE id = ? AND is_active = 1 LIMIT 1");
  $st->execute([$productId]);
  $row = $st->fetch(PDO::FETCH_ASSOC);
  if (!$row) return null;

  $basePrice = (int)($row['price_cents'] ?? 0);
  $baseSku = trim((string)($row['sku'] ?? ''));
  $basePack = trim((string)($row['pack_label'] ?? ''));
  $sku = trim($sku);
  $packLabel = trim($packLabel);

  foreach (normalize_shop_variants($row['variants_src'] ?? null) as $variant) {
    $variantSku = trim((string)($variant['sku'] ?? ''));
    $variantPack = trim((string)($variant['label'] ?? ''));
    $variantPrice = (int)($variant['price_cents'] ?? 0);

    $skuMatches = ($sku !== '' && $variantSku !== '' && hash_equals($variantSku, $sku));
    $packMatches = ($packLabel !== '' && $variantPack !== '' && hash_equals($variantPack, $packLabel));

    if (($skuMatches || $packMatches) && $variantPrice > 0) {
      return $variantPrice;
    }
  }

  if (($sku === '' || $sku === $baseSku) && ($packLabel === '' || $packLabel === $basePack || $basePack === '')) {
    return $basePrice > 0 ? $basePrice : null;
  }

  return $basePrice > 0 ? $basePrice : null;
}

try {
  $pdo->beginTransaction();

  $user_id = null;

  if (!empty($_SESSION['user_id'])) {
    $user_id = (int)$_SESSION['user_id'];

    $stU = $pdo->prepare("SELECT id FROM users WHERE id=? LIMIT 1");
    $stU->execute([$user_id]);
    $u = $stU->fetch();

    if (!$u) {
      $user_id = null;
      unset($_SESSION['user_id']);
    }
  }

  if ($user_id === null && $create_account) {
    $st = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $st->execute([$email]);
    $exists = $st->fetchColumn();

    if ($exists) {
      $pdo->rollBack();
      json_error('E-post on juba kasutusel palun logi sisse', 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $st = $pdo->prepare("
      INSERT INTO users (email, phone, first_name, last_name, password_hash)
      VALUES (?,?,?,?,?)
    ");
    $st->execute([$email, $phone, $first_name, $last_name, $hash]);

    $user_id = (int)$pdo->lastInsertId();
    $_SESSION['user_id'] = $user_id;
  }

  $st = $pdo->prepare("
    INSERT INTO orders (user_id, first_name, last_name, phone, email, notes, shipping_method, shipping_text, payment_method, total_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ");
  $st->execute([
    $user_id,
    $first_name,
    $last_name,
    $phone,
    $email,
    $notes,
    $shipping_method,
    $shipping_text,
    $payment_method,
    $total_cents
  ]);

  $order_id = (int)$pdo->lastInsertId();

  $stItem = $pdo->prepare("
    INSERT INTO order_items (order_id, product_id, product_name, qty, price_cents, line_total_cents)
    VALUES (?, ?, ?, ?, ?, ?)
  ");

  $validatedTotalCents = 0;
  $insertedItems = 0;

  foreach ($items as $it) {
    $name = trim((string)($it['name'] ?? ''));
    $qty  = (int)($it['qty'] ?? 0);
    $clientPriceCents = (int)($it['price_cents'] ?? 0);
    $product_id  = isset($it['product_id']) ? (int)$it['product_id'] : null;
    $sku = trim((string)($it['sku'] ?? ''));
    $packLabel = trim((string)($it['pack_label'] ?? ''));

    if (($product_id ?? 0) <= 0) { $pdo->rollBack(); json_error('Toote ID puudub', 422); }
    if ($qty <= 0 || $qty > 1000) { $pdo->rollBack(); json_error('Kogus on vigane', 422); }
    if ($name === '') $name = 'Toode';

    $price_cents = $clientPriceCents;
    $resolvedPrice = resolve_product_price_cents($pdo, (int)$product_id, $sku, $packLabel);
    if ($resolvedPrice === null || $resolvedPrice <= 0) { $pdo->rollBack(); json_error('Toote hinda ei saanud kinnitada', 422); }
    $price_cents = $resolvedPrice;

    $line_total = $qty * $price_cents;
    $validatedTotalCents += $line_total;
    $insertedItems++;

    $stItem->execute([
      $order_id,
      $product_id ?: null,
      $name,
      $qty,
      $price_cents,
      $line_total
    ]);
  }

  if ($insertedItems <= 0) {
    $pdo->rollBack();
    json_error('Ostukorv on tühi', 422);
  }

  if ($validatedTotalCents !== $total_cents) {
    $upOrder = $pdo->prepare('UPDATE orders SET total_cents = ? WHERE id = ?');
    $upOrder->execute([$validatedTotalCents, $order_id]);
    $total_cents = $validatedTotalCents;
  }

  $pdo->commit();

  if (
    $mailer_ok &&
    function_exists('smtp_mail_send') &&
    function_exists('build_order_email')
  ) {
    try {
      $adminEmail = 'info@eurpgr.ee';

      $mailData = build_order_email([
        'order_id' => $order_id,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'phone' => $phone,
        'email' => $email,
        'notes' => $notes,
        'shipping_method' => $shipping_method,
        'shipping_text' => $shipping_text,
        'payment_method' => $payment_method,
        'total_cents' => $total_cents,
      ], $items);

      $ok1 = smtp_mail_send(
        $email,
        $mailData['subject'],
        $mailData['html'],
        $mailData['text'],
        'info@eurpgr.ee'
      );
      if (!$ok1) error_log("[order_mail] customer failed order_id={$order_id} to={$email}");


      $ok2 = smtp_mail_send(
        $adminEmail,
        $mailData['subject'] . ' (admin copy)',
        $mailData['html'],
        $mailData['text'],
        $email
      );
      if (!$ok2) error_log("[order_mail] admin failed order_id={$order_id} to={$adminEmail}");

    } catch (Throwable $e) {
      error_log("[order_mail] exception order_id={$order_id}: " . $e->getMessage());
    }
  } else {
      
    error_log("[order_mail] skipped: mailer_ok=" . ($mailer_ok ? '1' : '0'));
  }

  json_ok([
    'order_id' => $order_id,
    'user_id'  => $user_id,
  ]);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  error_log('[order_create] ' . $e->getMessage());
  json_error('Serveri sisemine viga', 500);
}
