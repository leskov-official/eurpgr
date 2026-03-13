<?php
require __DIR__ . '/db.php';

function load_user(PDO $pdo, int $uid): ?array {
  $st = $pdo->prepare("
    SELECT
      id,
      email,
      first_name,
      last_name,
      phone,
      avatar_url,
      is_verified
    FROM users
    WHERE id=?
    LIMIT 1
  ");
  $st->execute([$uid]);
  $u = $st->fetch(PDO::FETCH_ASSOC);
  if (!$u) {
    return null;
  }

  $u['id'] = (int)$u['id'];
  $u['is_verified'] = (int)($u['is_verified'] ?? 0);
  return $u;
}

function load_user_by_remember(PDO $pdo, string $selector, string $token): ?array {
  $st = $pdo->prepare("
    SELECT id, user_id, token_hash, expires_at
    FROM user_remember_tokens
    WHERE selector=?
    LIMIT 1
  ");
  $st->execute([$selector]);
  $row = $st->fetch(PDO::FETCH_ASSOC);
  if (!$row) return null;

  if (strtotime((string)$row['expires_at']) <= time()) {
    $pdo->prepare('DELETE FROM user_remember_tokens WHERE id = ?')->execute([(int)$row['id']]);
    return null;
  }

  $calc = hash('sha256', $token);
  if (!hash_equals((string)$row['token_hash'], $calc)) {
    $pdo->prepare('DELETE FROM user_remember_tokens WHERE id = ?')->execute([(int)$row['id']]);
    return null;
  }

  $uid = (int)$row['user_id'];
  $_SESSION['user_id'] = $uid;

  return load_user($pdo, $uid);
}

if (!empty($_SESSION['user_id'])) {
  $u = load_user($pdo, (int)$_SESSION['user_id']);
  if ($u) {
    json_ok(['user' => $u]);
  }

  unset($_SESSION['user_id']);
}

$cookie = $_COOKIE['remember'] ?? '';
if (is_string($cookie) && strpos($cookie, ':') !== false) {
  [$selector, $token] = explode(':', $cookie, 2);
  $selector = trim($selector);
  $token = trim($token);

  if ($selector !== '' && $token !== '') {
    $u = load_user_by_remember($pdo, $selector, $token);
    if ($u) {
      json_ok(['user' => $u]);
    }
  }
}

json_ok(['user' => null]);
