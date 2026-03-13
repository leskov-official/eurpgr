<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

$new = (int)$pdo->query("SELECT COUNT(*) AS c FROM orders WHERE status='new'")->fetchColumn();

$todayTotal = (int)$pdo->query("SELECT COALESCE(SUM(total_cents),0) FROM orders WHERE DATE(created_at)=CURDATE() AND status NOT IN ('cancelled')")->fetchColumn();

$users = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

$uploadsDir = realpath(__DIR__ . '/../uploads');
$uploadFiles = 0;
if ($uploadsDir && is_dir($uploadsDir)) {
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploadsDir, FilesystemIterator::SKIP_DOTS));
  foreach ($it as $f) {
    if ($f->isFile()) $uploadFiles++;
  }
}

$st = $pdo->query("SELECT id, first_name, last_name, total_cents, status, created_at FROM orders ORDER BY id DESC LIMIT 8");
$latest = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
foreach ($latest as &$o) {
  $o['id'] = (int)$o['id'];
  $o['total_cents'] = (int)$o['total_cents'];
}

json_ok([
  'stats' => [
    'new_orders' => $new,
    'today_total_cents' => $todayTotal,
    'users' => $users,
    'upload_files' => $uploadFiles,
  ],
  'latest_orders' => $latest,
]);
