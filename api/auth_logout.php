<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_err('Method not allowed', 405);
}

$cookie = $_COOKIE['remember'] ?? '';
if (is_string($cookie) && str_contains($cookie, ':')) {
  [$selector] = explode(':', $cookie, 2);
  $selector = trim((string)$selector);

  if ($selector !== '') {
    $st = $pdo->prepare('DELETE FROM user_remember_tokens WHERE selector=?');
    $st->execute([$selector]);
  }
}

setcookie('remember', '', cookie_options(time() - 3600));

$_SESSION = [];

if (session_status() === PHP_SESSION_ACTIVE) {
  session_regenerate_id(true);
  session_destroy();
}

json_ok();
