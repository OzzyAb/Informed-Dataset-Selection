<?php
include_once('utils.php');

class Algorithm {
    public static function getAll($pdo) {
        header('Content-Type: application/json');
        
        $sql = "SELECT Id, Name FROM Algorithms";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            "isSuccess" => true,
            "statusCode" => 200,
            "data" => lowerFirstLetter($data)
        ]);
    }

    public static function get($pdo, $id) {
        header('Content-Type: application/json');

        $sql = "SELECT Id, Name FROM Algorithms WHERE Id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($data) {
            http_response_code(200);
            echo json_encode([
                "isSuccess" => true,
                "statusCode" => 200,
                "data" => lowerFirstLetter($data)
            ]);
        }
        else {
            http_response_code(404);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 404,
                "data" => "Algorithm does not exist"
            ]);
        }
    }
}
?>