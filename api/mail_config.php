<?php
declare(strict_types=1);

const SMTP_HOST = 'csmtp.telia.ee';
const SMTP_USER = 'info@eurpgr.ee';

$SMTP_PASS = getenv('SMTP_PASS') ?: 'IgorLeskov57529224';

const SMTP_PORT = 587;
const SMTP_SECURE = 'tls';
