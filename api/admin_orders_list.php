<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = (int)($_GET['limit'] ?? 20);
$limit = min(100, max(5, $limit));
$offset = ($page - 1) * $limit;

$q = trim((string)($_GET['q'] ?? ''));
$status = trim((string)($_GET['status'] ?? ''));

$where = [];
$params = [];

if ($status !== '') {
  $where[] = 'status = ?';
  $params[] = $status;
}

if ($q !== '') {
  if (ctype_digit($q)) {
    $where[] = '(id = ? OR phone LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    $params[] = (int)$q;
  } else {
    $where[] = '(phone LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
  }
  $like = '%' . $q . '%';
  if (ctype_digit($q)) {
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
  } else {
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
  }
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$stT = $pdo->prepare("SELECT COUNT(*) FROM orders $whereSql");
$stT->execute($params);
$total = (int)$stT->fetchColumn();
$pages = max(1, (int)ceil($total / $limit));
$page = min($page, $pages);
$offset = ($page - 1) * $limit;

$sql = "
  SELECT
    id, user_id, first_name, last_name, phone, email, notes,
    shipping_method, shipping_text, payment_method,
    total_cents, currency, status, created_at
  FROM orders
  $whereSql
  ORDER BY id DESC
  LIMIT $limit OFFSET $offset
";

$st = $pdo->prepare($sql);
$st->execute($params);
$rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
foreach ($rows as &$o) {
  $o['id'] = (int)$o['id'];
  $o['user_id'] = $o['user_id'] !== null ? (int)$o['user_id'] : null;
  $o['total_cents'] = (int)$o['total_cents'];
}

json_ok([
  'page' => $page,
  'pages' => $pages,
  'limit' => $limit,
  'total' => $total,
  'orders' => $rows,
]);
