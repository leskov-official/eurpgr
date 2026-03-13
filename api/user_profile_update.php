<?php
require __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) json_err('Pole autentitud', 401);
$uid = (int)$_SESSION['user_id'];

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$first = trim((string)($in['first_name'] ?? ''));
$last  = trim((string)($in['last_name'] ?? ''));
$phone = trim((string)($in['phone'] ?? ''));
$avatar_url = trim((string)($in['avatar_url'] ?? ''));

if ($first === '' || $last === '') json_err('Ees- ja perekonnanimi on kohustuslikud', 422);
if ($phone !== '' && !preg_match('~^[0-9+()\-\s]{5,30}$~', $phone)) json_err('Vigane telefoninumber', 422);
if ($avatar_url !== '' && !preg_match('~^https?://~i', $avatar_url)) {
  if (!str_starts_with($avatar_url, '/')) json_err('Vigane avatari URL', 422);
}
if ($avatar_url !== '' && preg_match('~^(?:javascript|data):~i', $avatar_url)) json_err('Vigane avatari URL', 422);

$st = $pdo->prepare("UPDATE users SET first_name=?, last_name=?, phone=?, avatar_url=? WHERE id=?");
$st->execute([$first, $last, $phone ?: null, $avatar_url ?: null, $uid]);

json_ok();
