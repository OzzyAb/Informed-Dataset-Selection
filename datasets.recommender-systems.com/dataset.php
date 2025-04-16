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

$id = isset($_GET['id']) ? $_GET['id'] : null;
if ($id === null) {
    http_response_code(404);
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 404,
        "message" => "Query parameter is missing"
    ]);
    exit();
}
if (!is_numeric($id)) {
    http_response_code(400);
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 400,
        "message" => "Wrong query parameter"
    ]);
    exit();
}

$sql = "SELECT Id, 
Name, 
NumberOfUsers, 
NumberOfItems, 
NumberOfInteractions, 
UserItemRatio, 
ItemUserRatio, 
Density, 
FeedbackType, 
HighestNumberOfRatingBySingleUser, 
LowestNumberOfRatingBySingleUser, 
HighestNumberOfRatingOnSingleItem, 
LowestNumberOfRatingOnSingleItem, 
MeanNumberOfRatingsByUser, 
MeanNumberOfRationsOnItem 
FROM Datasets
WHERE Id = :id";
$stmt = $pdo->prepare($sql);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();

$data = $stmt->fetch(PDO::FETCH_ASSOC);
if ($data) {
    $formattedData = lowercaseFirstLetterKeys($data);
    http_response_code(200);
    echo json_encode([
        "isSuccess" => true,
        "statusCode" => 200,
        "data" => $formattedData
    ]);
}
else {
    http_response_code(404);
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 404,
        "data" => "Dataset does not exist"
    ]);
}
?>