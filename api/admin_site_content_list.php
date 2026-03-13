<?php
declare(strict_types=1);
require_once __DIR__ . '/admin_config.php';
require_once __DIR__ . '/site_content_lib.php';
require_admin($pdo);
$pageKey = normalize_page_key((string)($_GET['page_key'] ?? 'home'));
json_ok(fetch_site_content($pdo, $pageKey));
