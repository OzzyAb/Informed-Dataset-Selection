<?php
include_once('db_conn.php');

$pdo = Database::checkConnection();
if ($pdo === null) {
    http_response_code(500);
}
else {
    http_response_code(200);
}
?>