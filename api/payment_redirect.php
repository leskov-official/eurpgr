<?php
declare(strict_types=1);

require_once __DIR__ . '/db_connect.php';

$pdo = db();

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$method  = isset($_GET['method']) ? trim((string)$_GET['method']) : '';

$allowed = ['swedbank','seb','lhv','luminor','coop','revolut','paysera','wise','n26','kniks'];

if ($orderId <= 0) {
    http_response_code(400);
    exit('Invalid order_id');
}

if ($method === '' || !in_array($method, $allowed, true)) {
    http_response_code(400);
    exit('Invalid payment method');
}

try {
    $st = $pdo->prepare("
        UPDATE orders
        SET payment_method = :method
        WHERE id = :id
        LIMIT 1
    ");
    $st->execute([
        ':method' => $method,
        ':id'     => $orderId,
    ]);

    $_SESSION['last_order_id'] = $orderId;

    $baseUrl = rtrim((string)(getenv('APP_BASE_URL') ?: 'https://eurpgr.ee'), '/');
    $returnOk = $baseUrl . '/api/payment_return.php?status=success&order_id=' . urlencode((string)$orderId);

    header('Location: ' . $returnOk);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    exit('Payment redirect error: ' . $e->getMessage());
}
