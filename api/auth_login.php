<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_err('Method not allowed', 405);
}

$loginAttempts = $_SESSION['login_attempts'] ?? ['count' => 0, 'time' => time()];
if (!is_array($loginAttempts)) { $loginAttempts = ['count' => 0, 'time' => time()]; }
if ((time() - (int)$loginAttempts['time']) > 900) { $loginAttempts = ['count' => 0, 'time' => time()]; }
if ((int)$loginAttempts['count'] >= 8) { json_err('Liiga palju sisselogimiskatseid. Proovi hiljem uuesti.', 429); }

$raw = get_raw_request_body();
$in = json_decode($raw, true);
if (!is_array($in)) { $in = []; }

$email_raw = trim((string)($in['email'] ?? ''));
$pass      = (string)($in['password'] ?? '');
$remember  = (bool)($in['remember'] ?? false);

if (!filter_var($email_raw, FILTER_VALIDATE_EMAIL)) json_err('Vigane e-posti aadress', 422);
if ($pass === '') json_err('Parool on kohustuslik', 422);

$email_lc = mb_strtolower($email_raw, 'UTF-8');

$stmt = $pdo->prepare("
  SELECT id, email, password_hash, first_name, last_name, phone, avatar_url, is_verified
  FROM users
  WHERE LOWER(email)=?
  LIMIT 1
");
$stmt->execute([$email_lc]);
$user = $stmt->fetch();

if (!$user) { $_SESSION['login_attempts'] = ['count' => (int)$loginAttempts['count'] + 1, 'time' => time()]; json_err('Kasutajat ei leitud', 401); }
if (!password_verify($pass, (string)$user['password_hash'])) { $_SESSION['login_attempts'] = ['count' => (int)$loginAttempts['count'] + 1, 'time' => time()]; json_err('Vale parool', 401); }

$_SESSION['login_attempts'] = ['count' => 0, 'time' => time()];
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];

if ($remember) {
  $selector = bin2hex(random_bytes(12));
  $token = bin2hex(random_bytes(32));
  $token_hash = hash('sha256', $token);
  $expiresAt = new DateTimeImmutable('+30 days');

  $pdo->prepare('DELETE FROM user_remember_tokens WHERE user_id = ?')->execute([(int)$user['id']]);

  $ins = $pdo->prepare("
    INSERT INTO user_remember_tokens (user_id, selector, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  ");
  $ins->execute([
    (int)$user['id'],
    $selector,
    $token_hash,
    $expiresAt->format('Y-m-d H:i:s')
  ]);

  setcookie('remember', $selector . ':' . $token, cookie_options(time() + 60 * 60 * 24 * 30));
}

csrf_token();

json_ok([
  'csrf_token' => csrf_token(),
  'user' => [
    'id' => (int)$user['id'],
    'email' => $user['email'],
    'first_name' => $user['first_name'],
    'last_name' => $user['last_name'],
    'phone' => $user['phone'],
    'avatar_url' => $user['avatar_url'] ?? null,
    'is_verified' => (int)($user['is_verified'] ?? 0),
  ]
]);
