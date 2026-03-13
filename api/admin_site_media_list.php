<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
require_admin($pdo);
$dirs = [dirname(__DIR__) . '/images/uploads/shop', dirname(__DIR__) . '/images/uploads/site-media'];
$items = [];
foreach ($dirs as $dir) {
  if (!is_dir($dir)) continue;
  $it = new DirectoryIterator($dir);
  foreach ($it as $file) {
    if ($file->isDot() || !$file->isFile()) continue;
    $name = $file->getFilename();
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $kind = in_array($ext, ['mp4'], true) ? 'video' : 'image';
    $url = str_replace(dirname(__DIR__), '', $file->getPathname());
    $url = str_replace('\\', '/', $url);
    $items[] = ['name'=>$name,'url'=>$url,'media_type'=>$kind,'size'=>$file->getSize(),'mtime'=>$file->getMTime()];
  }
}
usort($items, fn($a,$b)=>($b['mtime']<=>$a['mtime']) ?: strcmp($a['name'],$b['name']));
json_ok(['items'=>$items]);
