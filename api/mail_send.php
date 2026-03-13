<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function send_mail(string $to, string $subject, string $html, array &$meta = []): bool {
  $mail = new PHPMailer(true);

  try {
    $smtpHost = getenv('SMTP_HOST') ?: 'csmtp.telia.ee';
    $smtpUser = getenv('SMTP_USER') ?: 'info@eurpgr.ee';
    $smtpPass = getenv('SMTP_PASS') ?: 'IgorLeskov57529224';
    $smtpPort = (int)(getenv('SMTP_PORT') ?: 587);

    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $smtpPort;

    $mail->CharSet = 'UTF-8';

    $mail->setFrom('info@eurpgr.ee', 'EUROPAGAR');
    $mail->addReplyTo('info@eurpgr.ee', 'EUROPAGAR');
    $mail->addAddress($to);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html)));

    $mail->send();

    $meta = [
      'to' => $to,
      'subject' => $subject,
      'message_id' => $mail->getLastMessageID(),
    ];

    error_log('MAIL_OK ' . json_encode($meta, JSON_UNESCAPED_UNICODE));
    return true;

  } catch (Exception $e) {
    $meta = [
      'to' => $to,
      'subject' => $subject,
      'error' => $mail->ErrorInfo,
      'exception' => $e->getMessage(),
    ];

    error_log('MAIL_FAIL ' . json_encode($meta, JSON_UNESCAPED_UNICODE));
    return false;
  }
}
