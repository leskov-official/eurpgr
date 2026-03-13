<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

require_admin($pdo);

$base = realpath(__DIR__ . '/../uploads');
if (!$base || !is_dir($base)) {
  json_ok(['files' => []]);
}

function human_size(int $bytes): string {
  $units = ['B','KB','MB','GB','TB'];
  $i = 0;
  $v = (float)$bytes;
  while ($v >= 1024 && $i < count($units)-1) { $v /= 1024; $i++; }
  return rtrim(rtrim(number_format($v, $i===0?0:2, '.', ''), '0'), '.') . ' ' . $units[$i];
}

$files = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
  if (!$f->isFile()) continue;
  $abs = $f->getRealPath();
  if (!$abs) continue;
  $rel = str_replace($base, '', $abs);
  $rel = str_replace('\\', '/', $rel);
  if (str_starts_with($rel, '/')) $rel = substr($rel, 1);

  $files[] = [
    'name' => basename($abs),
    'rel' => $rel,
    'size' => $f->getSize(),
    'size_h' => human_size((int)$f->getSize()),
    'mtime' => $f->getMTime(),
    'mtime_h' => date('Y-m-d H:i', $f->getMTime()),
  ];
}

usort($files, fn($a,$b) => ($b['mtime'] <=> $a['mtime']));

if (count($files) > 500) $files = array_slice($files, 0, 500);

json_ok(['files' => $files]);
