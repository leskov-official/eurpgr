<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mail_send.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_err('Method not allowed', 405);
}

$raw = file_get_contents('php://input');
$in = json_decode($raw, true);

$email = '';
if (is_array($in) && isset($in['email'])) {
  $email = trim((string)$in['email']);
} else {
  $email = trim((string)($_POST['email'] ?? ''));
}

if ($email === '') json_err('E-posti aadress on kohustuslik');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Vigane e-posti aadress');
$email = mb_strtolower($email, 'UTF-8');

$stmt = $pdo->prepare("SELECT id, email FROM users WHERE LOWER(email) = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

error_log('RESET_STEP ' . json_encode([
  'step'  => 'lookup',
  'email' => $email,
  'found' => (bool)$user
], JSON_UNESCAPED_UNICODE));

if (!$user) {
  json_ok(['message' => 'Kui konto on olemas, on e-kiri saadetud']);
}

$userId = (int)$user['id'];

$token = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$expiresAt = date('Y-m-d H:i:s', time() + 3600);

try {
  $pdo->beginTransaction();

  $pdo->prepare("DELETE FROM user_password_resets WHERE user_id = ?")
      ->execute([$userId]);

  $pdo->prepare("INSERT INTO user_password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
      ->execute([$userId, $tokenHash, $expiresAt]);

  $pdo->commit();

} catch (Throwable $e) {
  $pdo->rollBack();
  error_log('RESET_DB_FAIL ' . json_encode([
    'email' => $email,
    'user_id' => $userId,
    'err' => $e->getMessage()
  ], JSON_UNESCAPED_UNICODE));

  json_ok(['message' => 'Kui konto on olemas, on e-kiri saadetud']);
}

$cntSt = $pdo->prepare("SELECT COUNT(*) FROM user_password_resets WHERE user_id = ?");
$cntSt->execute([$userId]);
$count = (int)$cntSt->fetchColumn();

error_log('RESET_STEP ' . json_encode([
  'step' => 'db_check',
  'user_id' => $userId,
  'count' => $count
], JSON_UNESCAPED_UNICODE));

$baseUrl = rtrim((string)(getenv('APP_BASE_URL') ?: 'https://eurpgr.ee'), '/');
$link = $baseUrl . '/reset-password.php?token=' . urlencode($token);

$html = "
  <div style='font-family:Arial,sans-serif'>
    <h3>Parooli lähtestamine</h3>
    <p>Uue parooli määramiseks klõpsake lingil (kehtib 1 tund):</p>
    <p><a href='{$link}'>{$link}</a></p>
    <p>Kui te ei taotlenud parooli lähtestamist, ignoreerige seda e-kirja.</p>
  </div>
";

$meta = [];
$mailOk = send_mail($email, 'Parooli lähtestamine', $html, $meta);

error_log('RESET_STEP ' . json_encode([
  'step' => 'mail',
  'email' => $email,
  'user_id' => $userId,
  'mail_ok' => $mailOk,
  'mail_meta' => $meta
], JSON_UNESCAPED_UNICODE));

json_ok([
  'message' => 'Kui konto on olemas, on e-kiri saadetud',
  'debug' => [
    'user_id' => $userId,
    'resets_count_for_user' => $count,
  ]
]);
