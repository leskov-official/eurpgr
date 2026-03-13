<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
json_ok(['csrf_token' => csrf_token()]);
