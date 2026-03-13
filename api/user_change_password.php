<?php
require __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) json_err('Pole autentitud', 401);
$uid = (int)$_SESSION['user_id'];

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$current = (string)($in['current_password'] ?? '');
$new1 = (string)($in['new_password'] ?? '');
$new2 = (string)($in['new_password2'] ?? '');

if ($new1 !== $new2) json_err('Paroolid ei ühti', 422);
if (strlen($new1) < 8) json_err('Parool peab olema vähemalt 8 tähemärki pikk', 422);

$st = $pdo->prepare("SELECT password_hash FROM users WHERE id=?");
$st->execute([$uid]);
$u = $st->fetch();
if (!$u) json_err('Kasutajat ei leitud', 404);

if (!password_verify($current, $u['password_hash'])) json_err('Praegune parool on vale', 401);

$hash = password_hash($new1, PASSWORD_DEFAULT);
$up = $pdo->prepare("UPDATE users SET password_hash=? WHERE id=?");
$up->execute([$hash, $uid]);

json_ok();
