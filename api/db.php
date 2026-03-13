<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: SAMEORIGIN');
}


register_shutdown_function(function (): void {
    $e = error_get_last();
    if (!$e) {
        return;
    }

    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
    if (!in_array($e['type'], $fatalTypes, true)) {
        return;
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'ok' => false,
        'error' => 'Serveri sisemine viga',
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    if (is_string($forwardedProto) && strtolower($forwardedProto) === 'https') {
        return true;
    }

    return (int)($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

function cookie_options(int $expires = 0): array
{
    return [
        'expires' => $expires,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');

    if (is_https_request()) {
        ini_set('session.cookie_secure', '1');
    }

    session_start();
}

function get_raw_request_body(): string
{
    static $raw = null;
    if ($raw === null) {
        $raw = file_get_contents('php://input');
        if (!is_string($raw)) {
            $raw = '';
        }
    }
    return $raw;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token(?string $token): bool
{
    $expected = $_SESSION['csrf_token'] ?? '';
    return is_string($token) && is_string($expected) && $expected !== '' && hash_equals($expected, $token);
}

function request_csrf_token(): ?string
{
    $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (is_string($header) && trim($header) !== '') {
        return trim($header);
    }
    if (isset($_POST['csrf_token']) && is_string($_POST['csrf_token'])) {
        return trim($_POST['csrf_token']);
    }
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'application/json')) {
        $raw = get_raw_request_body();
        if ($raw !== '') {
            $data = json_decode($raw, true);
            if (is_array($data) && isset($data['csrf_token']) && is_string($data['csrf_token'])) {
                return trim($data['csrf_token']);
            }
        }
    }
    return null;
}

function require_csrf(): void
{
    if (!verify_csrf_token(request_csrf_token())) {
        json_err('CSRF token missing or invalid', 419);
    }
}

$__csrfExempt = ['csrf.php'];
$__method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$__script = basename((string)($_SERVER['SCRIPT_NAME'] ?? ''));
if (PHP_SAPI !== 'cli' && in_array($__method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && !in_array($__script, $__csrfExempt, true)) {
    require_csrf();
}

function json_err(string $message, int $code = 400): void
{
    if (!headers_sent()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'ok' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_ok(array $data = []): void
{
    if (!headers_sent()) {
        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
    exit;
}

$DB_HOST = getenv('DB_HOST') ?: 'd146238.mysql.teliaklm.ee';
$DB_NAME = getenv('DB_NAME') ?: 'd146238sd628094';
$DB_USER = getenv('DB_USER') ?: 'd146238sa573593';
$DB_PASS = getenv('DB_PASS') ?: 'pCf74nkuQDGuX6N642';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (Throwable $e) {
    error_log('[db] connection failed');
    json_err('Andmebaasi ühenduse viga', 500);
}
