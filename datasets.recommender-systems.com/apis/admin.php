<?php
include_once('utils.php');

class Admin {
    public static function getPerformanceResults($pdo, $headers) {
        header('Content-Type: application/json');

        self::checkAdminKey($headers);

        $stmt = $pdo->prepare('SELECT * FROM PerformanceResults');
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_OBJ);

        $transformed = [];

        foreach ($results as $row) {
            $rowArray = (array)$row;
            $grouped = [];
            $cleanRow = [];
        
            foreach ($rowArray as $key => $value) {
                if (preg_match('/^(Hr|Ndcg|Recall)_(.+)$/', $key, $matches)) {
                    $prefix = $matches[1];
                    $suffix = $matches[2];
                
                    if (!isset($grouped[$prefix])) {
                        $grouped[$prefix] = [];
                    }
                
                    $grouped[$prefix][$suffix] = $value;
                } else {
                    $cleanRow[$key] = $value;
                }
            }
        
            $transformed[] = array_merge($cleanRow, $grouped);
        }

        http_response_code(200);
        echo json_encode([
            "isSuccess" => true,
            "statusCode" => 200,
            "data" => $transformed
        ]);
    }

    public static function addPerformanceResults($pdo, $headers, $body) {
        header('Content-Type: application/json');

        self::checkAdminKey($headers);

        if (!isset($body['results']) || count($body['results']) == 0) {
            http_response_code(400);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 400,
                "message" => "There is no result to add"
            ]);
            exit();
        }

        $pdo->beginTransaction();
        try {
            $results = $body['results'];

            $utcNow = new DateTime("now", new DateTimeZone("UTC"));
            $createdDate = $utcNow->format('Y-m-d H:i:s.u');

            $createdAlgorithms = [];
            $createdDatasets = [];

            foreach ($results as $performanceResult) {
                // Check if the algorithm exists
                $stmt = $pdo->prepare('SELECT Id FROM Algorithms WHERE Name = :name');
                $stmt->execute([':name' => $performanceResult['algorithmName']]);
                $algorithm = $stmt->fetch(PDO::FETCH_OBJ);
                if (!$algorithm) {
                    $stmt = $pdo->prepare('INSERT INTO Algorithms (Name, CreatedDate) VALUES (:name, :createdDate)');
                    $stmt->execute([
                        ':name' => $performanceResult['algorithmName'],
                        ':createdDate' => $createdDate
                    ]);
                    $algorithmId = $pdo->lastInsertId();
                    $createdAlgorithms[] = $performanceResult['algorithmName'];
                }
                else {
                    $algorithmId = $algorithm->Id;
                }

                // Check if the dataset exists
                $stmt = $pdo->prepare('SELECT * FROM Datasets WHERE Name = :name');
                $stmt->execute([':name' => $performanceResult['datasetName']]);
                $dataset = $stmt->fetch(PDO::FETCH_OBJ);
                if (!$dataset) {
                    $stmt = $pdo->prepare('INSERT INTO Datasets 
                        (Name, CreatedDate, 
                            NumberOfUsers, NumberOfItems, NumberOfInteractions, UserItemRatio, ItemUserRatio, Density, 
                            FeedbackType, 
                            HighestNumberOfRatingBySingleUser, LowestNumberOfRatingBySingleUser, 
                            HighestNumberOfRatingOnSingleItem, LowestNumberOfRatingOnSingleItem, 
                            MeanNumberOfRatingsByUser, MeanNumberOfRatingsOnItem) 
                        VALUES (:name, :createdDate, 
                            :numberOfUsers, :numberOfItems, :numberOfInteractions, :userItemRatio, :itemUserRatio, :density, 
                            :feedbackType, 
                            :highestNumberOfRatingBySingleUser, :lowestNumberOfRatingBySingleUser, 
                            :highestNumberOfRatingOnSingleItem, :lowestNumberOfRatingOnSingleItem, 
                            :meanNumberOfRatingsByUser, :meanNumberOfRatingsOnItem) 
                    ');
                    $stmt->execute([
                        ':name' => $performanceResult['datasetName'],
                        ':createdDate' => $createdDate,
                        ':numberOfUsers' => $performanceResult['numberOfUsers'],
                        ':numberOfItems' => $performanceResult['numberOfItems'],
                        ':numberOfInteractions' => $performanceResult['numberOfInteractions'],
                        ':userItemRatio' => $performanceResult['userItemRatio'],
                        ':itemUserRatio' => $performanceResult['itemUserRatio'],
                        ':density' => $performanceResult['density'],
                        ':feedbackType' => $performanceResult['feedbackType'],
                        ':highestNumberOfRatingBySingleUser' => $performanceResult['highestNumberOfRatingBySingleUser'],
                        ':lowestNumberOfRatingBySingleUser' => $performanceResult['lowestNumberOfRatingBySingleUser'],
                        ':highestNumberOfRatingOnSingleItem' => $performanceResult['highestNumberOfRatingOnSingleItem'],
                        ':lowestNumberOfRatingOnSingleItem' => $performanceResult['lowestNumberOfRatingOnSingleItem'],
                        ':meanNumberOfRatingsByUser' => $performanceResult['meanNumberOfRatingsByUser'],
                        ':meanNumberOfRatingsOnItem' => $performanceResult['meanNumberOfRatingsOnItem']
                    ]);
                    $datasetId = $pdo->lastInsertId();
                    $createdDatasets[] = $performanceResult['datasetName'];
                } else {
                    $datasetId = $dataset->Id;
                }

                $stmt = $pdo->prepare('
                    INSERT INTO PerformanceResults 
                    (AlgorithmId, DatasetId, 
                        AlgorithmConfigIndex, AlgorithmConfiguration, 
                        Hr_One, Hr_Three, Hr_Five, Hr_Ten, Hr_Twenty, 
                        Recall_One, Recall_Three, Recall_Five, Recall_Ten, Recall_Twenty, 
                        Ndcg_One, Ndcg_Three, Ndcg_Five, Ndcg_Ten, Ndcg_Twenty) 
                    VALUES (:algorithmId, :datasetId,
                        :fold, :algorithmConfigIndex, :algorithmConfiguration, 
                        :hr_one, :hr_three, :hr_five, :hr_ten, :hr_twenty, 
                        :recall_one, :recall_three, :recall_five, :recall_ten, :recall_twenty, 
                        :ndcg_one, :ndcg_three, :ndcg_five, :ndcg_ten, :ndcg_twenty)
                ');
                $stmt->execute([
                    ':algorithmId' => $algorithmId,
                    ':datasetId' => $datasetId,
                    ':algorithmConfigIndex' => $performanceResult['algorithmConfigIndex'],
                    ':algorithmConfiguration' => $performanceResult['algorithmConfiguration'],
                    ':hr_one' => $performanceResult['hr']['one'],
                    ':hr_three' => $performanceResult['hr']['three'],
                    ':hr_five' => $performanceResult['hr']['five'],
                    ':hr_ten' => $performanceResult['hr']['ten'],
                    ':hr_twenty' => $performanceResult['hr']['twenty'],
                    ':recall_one' => $performanceResult['recall']['one'],
                    ':recall_three' => $performanceResult['recall']['three'],
                    ':recall_five' => $performanceResult['recall']['five'],
                    ':recall_ten' => $performanceResult['recall']['ten'],
                    ':recall_twenty' => $performanceResult['recall']['twenty'],
                    ':ndcg_one' => $performanceResult['ndcg']['one'],
                    ':ndcg_three' => $performanceResult['ndcg']['three'],
                    ':ndcg_five' => $performanceResult['ndcg']['five'],
                    ':ndcg_ten' => $performanceResult['ndcg']['ten'],
                    ':ndcg_twenty' => $performanceResult['ndcg']['twenty']
                ]);
            }

            $pdo->commit();

            http_response_code(200);
            echo json_encode([
                "isSuccess" => true,
                "statusCode" => 200,
                "data" => [
                    "createdAlgorithms" => $createdAlgorithms,
                    "createdDatasets" => $createdDatasets
                ]
            ]);
        }
        catch (Exception $ex) {
            $pdo->rollback();

            http_response_code(500);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 500,
                "message" => $ex->getMessage()
            ]);
        }
    }

    private static function checkAdminKey($headers) {
        $secrets = include('../configs/secrets.php');
        $key = isset($headers[$secrets['Admin']['HeaderKey']]) ? $headers[$secrets['Admin']['HeaderKey']] : null;
        if ($key === null || !hash_equals($secrets['Admin']['SecretKey'], $key)) {
            http_response_code(403);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 403,
                "message" => "Wrong key"
            ]);
            exit();
        }
    }
}
?>