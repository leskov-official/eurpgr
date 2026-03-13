<?php
declare(strict_types=1);

require_once __DIR__ . '/db_connect.php';

$pdo = db();

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$status  = isset($_GET['status']) ? trim((string)$_GET['status']) : 'cancel';

try {
    if ($orderId > 0) {
        if ($status === 'success') {
            $st = $pdo->prepare("
                UPDATE orders
                SET status = 'paid'
                WHERE id = :id
                LIMIT 1
            ");
            $st->execute([':id' => $orderId]);
        } else {
            $st = $pdo->prepare("
                UPDATE orders
                SET status = 'cancelled'
                WHERE id = :id
                LIMIT 1
            ");
            $st->execute([':id' => $orderId]);
        }
    }

    unset($_SESSION['last_order_id']);

    $baseUrl = rtrim((string)(getenv('APP_BASE_URL') ?: 'https://eurpgr.ee'), '/');
    $target = $baseUrl . '/account.html#profile';
    $safeTarget = htmlspecialchars($target, ENT_QUOTES, 'UTF-8');
    $safeStatus = htmlspecialchars($status, ENT_QUOTES, 'UTF-8');

    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="et">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>EUROPAGAR — Suunamine</title>
</head>
<body>
  <script>
    (function () {
      try {
        var status = <?php echo json_encode($safeStatus, JSON_UNESCAPED_UNICODE); ?>;

        if (status === 'success') {
          localStorage.removeItem('cart');
          localStorage.removeItem('cart_items');
          localStorage.removeItem('cart_total');
          localStorage.removeItem('europagar_cart');

          sessionStorage.removeItem('cart');
          sessionStorage.removeItem('cart_items');
          sessionStorage.removeItem('cart_total');
          sessionStorage.removeItem('europagar_cart');

          try {
            window.dispatchEvent(new Event('europagar-cart-updated'));
          } catch (e) {}
        }
      } catch (e) {}

      window.location.replace(<?php echo json_encode($target, JSON_UNESCAPED_UNICODE); ?>);
    })();
  </script>

  <noscript>
    <meta http-equiv="refresh" content="0;url=<?php echo $safeTarget; ?>">
    Suunamine...
  </noscript>
</body>
</html>
<?php
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    exit('Payment return error: ' . $e->getMessage());
}
