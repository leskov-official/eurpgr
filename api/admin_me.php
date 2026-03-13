<?php
declare(strict_types=1);

require __DIR__ . '/admin_config.php';

$u = require_admin($pdo);
json_ok(['user' => $u]);
