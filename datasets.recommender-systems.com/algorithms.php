<?php
include_once('db_conn.php');
include_once('utils.php');

header('Content-Type: application/json');

$pdo = Database::getConnection();  
if ($pdo === null) {
    http_response_code(500);
    
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 500,
        "message" => "Connection to the DB failed"
    ]);
    exit();
}

$sql = "SELECT Id, Name FROM Algorithms";
$stmt = $pdo->prepare($sql);
$stmt->execute();

$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
$formattedData = lowercaseFirstLetterKeysArray($data);
echo json_encode([
    "isSuccess" => true,
    "statusCode" => 200,
    "data" => $formattedData
]);
?>