<?php
declare(strict_types=1);

require_once __DIR__ . '/admin_config.php';
require_admin($pdo);

$in = read_json_body();
$ordered = $in['ordered_ids'] ?? null;

if (!is_array($ordered) || count($ordered) < 1) {
    json_err('ordered_ids required', 422);
}

try {
    $pdo->beginTransaction();

    $st = $pdo->prepare('UPDATE shop_categories SET sort = ? WHERE id = ?');

    $sort = 1;
    foreach ($ordered as $id) {
        $cid = (int)$id;
        if ($cid <= 0) {
            continue;
        }
        $st->execute([$sort++, $cid]);
    }

    $pdo->commit();

    json_ok([
        'updated' => $sort - 1,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_err('DB error: ' . $e->getMessage(), 500);
}
