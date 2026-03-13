<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_err('Method not allowed', 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$token = trim((string)($data['token'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($token === '' || $password === '') {
    json_err('Vigased andmed', 422);
}

if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
    json_err('Vigane token', 422);
}

if (strlen($password) < 8) {
    json_err('Parool peab olema vähemalt 8 tähemärki pikk', 422);
}

$tokenHash = hash('sha256', $token);

$stmt = $pdo->prepare("
    SELECT user_id, expires_at
    FROM user_password_resets
    WHERE token_hash = ?
    LIMIT 1
");
$stmt->execute([$tokenHash]);
$row = $stmt->fetch();

if (!$row) {
    json_err('Vigane või aegunud link', 400);
}

if (strtotime($row['expires_at']) < time()) {
    json_err('Link on aegunud', 400);
}

$userId = (int)$row['user_id'];

$newHash = password_hash($password, PASSWORD_DEFAULT);

$pdo->prepare("
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
")->execute([$newHash, $userId]);

$pdo->prepare("
    DELETE FROM user_password_resets
    WHERE user_id = ?
")->execute([$userId]);

json_ok(['message' => 'Parool on uuendatud']);
