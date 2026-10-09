<?php
declare(strict_types=1);

/**
 * Pehchaan DRP - Database Configuration
 * Supports both MySQL (Production cPanel) and SQLite (Local automated test harness)
 */

$getVal = function (string $key, $default = null) {
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    $val = getenv($key);
    return ($val !== false && $val !== '') ? $val : $default;
};

return [
    'driver' => $getVal('DB_DRIVER', 'mysql'),
    
    'mysql' => [
        'host' => $getVal('DB_HOST', '127.0.0.1'),
        'port' => (int)$getVal('DB_PORT', 3306),
        'database' => $getVal('DB_NAME', 'blockcode_pehchaan'),
        'username' => $getVal('DB_USER', 'root'),
        'password' => $getVal('DB_PASS', ''),
        'charset' => $getVal('DB_CHARSET', 'utf8mb4'),
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            PDO::ATTR_TIMEOUT => 5,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
        ]
    ],
    
    'sqlite' => [
        'path' => $getVal('DB_SQLITE_PATH', __DIR__ . '/../../database/pehchaan.sqlite'),
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ]
];
