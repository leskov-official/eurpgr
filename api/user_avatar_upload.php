<?php
require __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) json_err('Pole autentitud', 401);
$uid = (int)$_SESSION['user_id'];

if (!isset($_FILES['avatar'])) json_err('Fail puudub', 400);

$f = $_FILES['avatar'];
if ($f['error'] !== UPLOAD_ERR_OK) json_err('Üleslaadimise viga', 400);

$max = 2 * 1024 * 1024; 
if ($f['size'] > $max) json_err('Fail on liiga suur (maksimaalselt 2 MB)', 422);

$info = getimagesize($f['tmp_name']);
if (!$info) json_err('See ei ole pildifail', 422);

$mime = $info['mime'] ?? '';
$ext = match($mime) {
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  default      => ''
};
if ($ext === '') json_err('Lubatud: jpg, png, webp', 422);

$dir = realpath(__DIR__ . '/../uploads/avatars');
if (!$dir) {
  $dir = __DIR__ . '/../uploads/avatars';
  @mkdir($dir, 0755, true);
}

$name = 'u' . $uid . '_' . time() . '.' . $ext;
$path = rtrim($dir, '/') . '/' . $name;

if (!move_uploaded_file($f['tmp_name'], $path)) json_err('Teisaldamine ebaõnnestus', 500);

$url = '/uploads/avatars/' . $name;

$st = $pdo->prepare("UPDATE users SET avatar_url=? WHERE id=?");
$st->execute([$url, $uid]);

json_ok(['avatar_url' => $url]);
