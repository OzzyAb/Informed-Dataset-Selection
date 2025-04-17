<?php
class Database {
    private static $pdo = null;

    public static function checkConnection() {
        if (self::$pdo === null) {
            self::getConnection();
        }

        if (self::$pdo !== null) {
            http_response_code(200);
        } else {
            http_response_code(500);
        }
    }

    public static function getConnection() {
        if (self::$pdo === null) {
            $config = include('../configs/db_config.php');
            $host = $config['host'];
            $port = $config['port'];
            $dbname = $config['dbname'];
            $username = $config['username'];
            $password = $config['password'];

            try {
                $dsn = "mysql:host=$host;dbname=$dbname;port=$port";
                $options = [
                    PDO::ATTR_PERSISTENT => true,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ];

                self::$pdo = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                return null;
            }
        }

        return self::$pdo;
    }
}
?>