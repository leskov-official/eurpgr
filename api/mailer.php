<?php
declare(strict_types=1);

require_once __DIR__ . '/mail_config.php';

function require_phpmailer(): bool {
  static $loaded = false;
  if ($loaded) return true;

  $candidates = [
    __DIR__ . '/vendor/PHPMailer/src',
    __DIR__ . '/vendor/PHPMailer/PHPMailer/src',
    __DIR__ . '/../vendor/PHPMailer/src',
    __DIR__ . '/../vendor/PHPMailer/PHPMailer/src',
  ];

  foreach ($candidates as $srcDir) {
    $ex = $srcDir . '/Exception.php';
    $pm = $srcDir . '/PHPMailer.php';
    $sp = $srcDir . '/SMTP.php';
    if (is_file($ex) && is_file($pm) && is_file($sp)) {
      require_once $ex;
      require_once $pm;
      require_once $sp;
      $loaded = true;
      return true;
    }
  }

  error_log('[mailer] PHPMailer not found. Checked: ' . implode(' | ', $candidates));
  return false;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (!defined('SMTP_DEBUG')) {
  define('SMTP_DEBUG', false);
}

function smtp_mail_send(
  string $to,
  string $subject,
  string $html,
  string $text,
  ?string $replyTo = null
): bool {

  if (!require_phpmailer()) return false;

  global $SMTP_PASS;

  if (!isset($SMTP_PASS) || $SMTP_PASS === '') {
    error_log('[mailer] SMTP_PASS is empty');
    return false;
  }

  $mail = new PHPMailer(true);

  try {
    $mail->CharSet = 'UTF-8';

    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = (string)$SMTP_PASS;
    $mail->Port       = SMTP_PORT;
    $mail->SMTPSecure = SMTP_SECURE;

    if (SMTP_DEBUG) {
      $mail->SMTPDebug = 2;
      $mail->Debugoutput = 'error_log';
    }

    $mail->setFrom(SMTP_USER, 'EUROPAGAR');

    if ($replyTo) {
      $mail->addReplyTo($replyTo);
    }

    $mail->addAddress($to);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $html;
    $mail->AltBody = $text;

    return $mail->send();

  } catch (Exception $e) {
    error_log('[SMTP ERROR] ' . $e->getMessage());
    return false;
  } catch (Throwable $e) {
    error_log('[SMTP ERROR] ' . $e->getMessage());
    return false;
  }
}

function euro_from_cents(int $cents): string {
  $v = $cents / 100;
  return number_format($v, 2, ',', ' ') . " €";
}

function h(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function build_order_email(array $order, array $items): array {
  $orderId = (int)($order['order_id'] ?? 0);

  $fullName = trim(((string)($order['first_name'] ?? '')) . ' ' . ((string)($order['last_name'] ?? '')));
  $phone = (string)($order['phone'] ?? '');
  $email = (string)($order['email'] ?? '');
  $notes = (string)($order['notes'] ?? '');

  $shippingMethod = (string)($order['shipping_method'] ?? '');
  $shippingText   = (string)($order['shipping_text'] ?? '');
  $paymentMethod  = (string)($order['payment_method'] ?? '');
  $totalCents     = (int)($order['total_cents'] ?? 0);

  $rowsHtml = '';
  $rowsText = [];

  foreach ($items as $it) {
    $name = trim((string)($it['name'] ?? ''));
    $qty  = (int)($it['qty'] ?? 0);
    $priceCents = (int)($it['price_cents'] ?? 0);
    if ($name === '' || $qty <= 0 || $priceCents <= 0) continue;

    $line = $qty * $priceCents;

    $rowsHtml .= '<tr>'
      . '<td style="padding:8px;border-bottom:1px solid #eee;">' . h($name) . '</td>'
      . '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">' . $qty . '</td>'
      . '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">' . h(euro_from_cents($priceCents)) . '</td>'
      . '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">' . h(euro_from_cents($line)) . '</td>'
      . '</tr>';

    $rowsText[] = "- {$name} x{$qty} @ " . euro_from_cents($priceCents) . " = " . euro_from_cents($line);
  }

  $subject = "EUROPAGAR tellimus #{$orderId}";

  $html = "
  <div style='font-family:Arial,sans-serif;line-height:1.45;color:#111'>
    <h2 style='margin:0 0 10px 0'>Aitäh! Teie tellimus on vastu võetud.</h2>
    <p style='margin:0 0 14px 0'>Tellimuse number: <b>#".h((string)$orderId)."</b></p>

    <h3 style='margin:18px 0 8px 0'>Kliendi andmed</h3>
    <p style='margin:0'>
      <b>".h($fullName)."</b><br>
      Telefon: ".h($phone)."<br>
      E-post: ".h($email)."
    </p>

    <h3 style='margin:18px 0 8px 0'>Tarne / kättetoimetamine</h3>
    <p style='margin:0'>
      Meetod: ".h($shippingMethod)."<br>
      ".($shippingText !== '' ? ("Info: ".h($shippingText)."<br>") : "")."
    </p>

    <h3 style='margin:18px 0 8px 0'>Makse</h3>
    <p style='margin:0'>Makseviis: ".h($paymentMethod)."</p>

    <h3 style='margin:18px 0 8px 0'>Tellimuse sisu</h3>
    <table style='border-collapse:collapse;width:100%;max-width:720px'>
      <thead>
        <tr>
          <th style='text-align:left;padding:8px;border-bottom:2px solid #ddd'>Toode</th>
          <th style='text-align:center;padding:8px;border-bottom:2px solid #ddd'>Kogus</th>
          <th style='text-align:right;padding:8px;border-bottom:2px solid #ddd'>Hind</th>
          <th style='text-align:right;padding:8px;border-bottom:2px solid #ddd'>Summa</th>
        </tr>
      </thead>
      <tbody>{$rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan='3' style='padding:10px;border-top:2px solid #ddd;text-align:right'><b>Kokku</b></td>
          <td style='padding:10px;border-top:2px solid #ddd;text-align:right'><b>".h(euro_from_cents($totalCents))."</b></td>
        </tr>
      </tfoot>
    </table>

    ".($notes !== '' ? ("<h3 style='margin:18px 0 8px 0'>Märkused</h3><p style='margin:0'>".nl2br(h($notes))."</p>") : "")."

    <p style='margin:18px 0 0 0;color:#555'>
      Kontakt: <a href='mailto:info@europagar.ee'>info@europagar.ee</a>
    </p>
  </div>";

  $text =
    "Aitäh! Teie tellimus on vastu võetud.\n" .
    "Tellimuse number: #{$orderId}\n\n" .
    "Kliendi andmed:\n{$fullName}\nTelefon: {$phone}\nE-post: {$email}\n\n" .
    "Tarne / kättetoimetamine:\nMeetod: {$shippingMethod}\n" . ($shippingText !== '' ? "Info: {$shippingText}\n" : "") . "\n" .
    "Makse:\nMakseviis: {$paymentMethod}\n\n" .
    "Tellimuse sisu:\n" . implode("\n", $rowsText) . "\n\n" .
    "Kokku: " . euro_from_cents($totalCents) . "\n" .
    ($notes !== '' ? "\nMärkused:\n{$notes}\n" : "") .
    "\nKontakt: info@europagar.ee\n";

  return ['subject' => $subject, 'html' => $html, 'text' => $text];
}
