<?php
include_once('utils.php');

class Dataset {
    public static function getAll($pdo) {
        header('Content-Type: application/json');

        $sql = "SELECT Id, Name, 
        NumberOfUsers, NumberOfItems, NumberOfInteractions, 
        UserItemRatio, ItemUserRatio, Density, 
        FeedbackType, 
        HighestNumberOfRatingBySingleUser, LowestNumberOfRatingBySingleUser, 
        HighestNumberOfRatingOnSingleItem, LowestNumberOfRatingOnSingleItem, 
        MeanNumberOfRatingsByUser, MeanNumberOfRationsOnItem 
        FROM Datasets";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $formattedData = lowercaseFirstLetterKeysArray($data);
        echo json_encode([
            "isSuccess" => true,
            "statusCode" => 200,
            "data" => $formattedData
        ]);
    }

    public static function get($pdo, $id) {
        header('Content-Type: application/json');

        $sql = "SELECT Id, Name, 
        NumberOfUsers, NumberOfItems, NumberOfInteractions, 
        UserItemRatio, ItemUserRatio, Density, 
        FeedbackType, 
        HighestNumberOfRatingBySingleUser, LowestNumberOfRatingBySingleUser, 
        HighestNumberOfRatingOnSingleItem, LowestNumberOfRatingOnSingleItem, 
        MeanNumberOfRatingsByUser, MeanNumberOfRationsOnItem 
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
    }
}
?>