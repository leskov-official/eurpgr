<?php
require __DIR__ . '/db.php';

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim((string)($in['email'] ?? ''));
$pass  = (string)($in['password'] ?? '');
$first = trim((string)($in['first_name'] ?? ''));
$last  = trim((string)($in['last_name'] ?? ''));
$phone = trim((string)($in['phone'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Vigane e-posti aadress');
if (strlen($pass) < 8) json_err('Parool peab olema vähemalt 8 tähemärki pikk');

$hash = password_hash($pass, PASSWORD_DEFAULT);

try {
  $stmt = $pdo->prepare("INSERT INTO users (email, phone, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)");
  $stmt->execute([$email, $phone ?: null, $first ?: null, $last ?: null, $hash]);
  $uid = (int)$pdo->lastInsertId();
  $_SESSION['user_id'] = $uid;
  json_ok(['user' => ['id' => $uid, 'email' => $email]]);
} catch (Throwable $e) {
  if (str_contains($e->getMessage(), 'uniq_users_email')) json_err('E-posti aadress on juba kasutusel', 409);
  json_err('Registreerimine ebaõnnestus', 500);
}
