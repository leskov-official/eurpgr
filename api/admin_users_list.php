<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = (int)($_GET['limit'] ?? 20);
$limit = min(100, max(5, $limit));
$offset = ($page - 1) * $limit;

$q = trim((string)($_GET['q'] ?? ''));

$where = '';
$params = [];
if ($q !== '') {
  $where = "WHERE email LIKE ? OR phone LIKE ? OR first_name LIKE ? OR last_name LIKE ?";
  $like = '%' . $q . '%';
  $params = [$like, $like, $like, $like];
}

$stT = $pdo->prepare("SELECT COUNT(*) FROM users $where");
$stT->execute($params);
$total = (int)$stT->fetchColumn();
$pages = max(1, (int)ceil($total / $limit));
$page = min($page, $pages);
$offset = ($page - 1) * $limit;

$sql = "
  SELECT id, email, first_name, last_name, phone, is_verified, created_at
  FROM users
  $where
  ORDER BY id DESC
  LIMIT $limit OFFSET $offset
";
$st = $pdo->prepare($sql);
$st->execute($params);
$rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
foreach ($rows as &$u) {
  $u['id'] = (int)$u['id'];
  $u['is_verified'] = (int)($u['is_verified'] ?? 0);
}

json_ok([
  'page' => $page,
  'pages' => $pages,
  'limit' => $limit,
  'total' => $total,
  'users' => $rows,
]);
