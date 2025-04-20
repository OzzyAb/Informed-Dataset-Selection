<?php
include_once('utils.php');

class Admin {
    public static function updatePca($pdo, $headers, $body) {
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
            // Delete all results first
            $pdo->exec('DELETE FROM PcaResults');

            // Add new ones
            $pcaResults = $body['results'];

            $utcNow = new DateTime("now", new DateTimeZone("UTC"));
            $createdDate = $utcNow->format('Y-m-d H:i:s.u');

            foreach ($pcaResults as $result) {


                $stmt = $pdo->prepare('INSERT INTO PcaResults 
                    (DatasetId, CreatedDate, 
                        Ndcg_One_X, Ndcg_One_Y, Ndcg_Three_X, Ndcg_Three_Y, Ndcg_Five_X, Ndcg_Five_Y, Ndcg_Ten_X, Ndcg_Ten_Y, Ndcg_Twenty_X, Ndcg_Twenty_Y, 
                        Ndcg_One_VarianceX, Ndcg_One_VarianceY, Ndcg_Three_VarianceX, Ndcg_Three_VarianceY, Ndcg_Five_VarianceX, Ndcg_Five_VarianceY, Ndcg_Ten_VarianceX, Ndcg_Ten_VarianceY, Ndcg_Twenty_VarianceX, Ndcg_Twenty_VarianceY, 
                        Hr_One_X, Hr_One_Y, Hr_Three_X, Hr_Three_Y, Hr_Five_X, Hr_Five_Y, Hr_Ten_X, Hr_Ten_Y, Hr_Twenty_X, Hr_Twenty_Y, 
                        Hr_One_VarianceX, Hr_One_VarianceY, Hr_Three_VarianceX, Hr_Three_VarianceY, Hr_Five_VarianceX, Hr_Five_VarianceY, Hr_Ten_VarianceX, Hr_Ten_VarianceY, Hr_Twenty_VarianceX, Hr_Twenty_VarianceY, 
                        Recall_One_X, Recall_One_Y, Recall_Three_X, Recall_Three_Y, Recall_Five_X, Recall_Five_Y, Recall_Ten_X, Recall_Ten_Y, Recall_Twenty_X, Recall_Twenty_Y, 
                        Recall_One_VarianceX, Recall_One_VarianceY, Recall_Three_VarianceX, Recall_Three_VarianceY, Recall_Five_VarianceX, Recall_Five_VarianceY, Recall_Ten_VarianceX, Recall_Ten_VarianceY, Recall_Twenty_VarianceX, Recall_Twenty_VarianceY)
                    VALUES (:datasetId, :createdDate, 
                        :ndcg_One_X, :ndcg_One_Y, :ndcg_Three_X, :ndcg_Three_Y, :ndcg_Five_X, :ndcg_Five_Y, :ndcg_Ten_X, :ndcg_Ten_Y, :ndcg_Twenty_X, :ndcg_Twenty_Y, 
                        :ndcg_One_VarianceX, :ndcg_One_VarianceY, :ndcg_Three_VarianceX, :ndcg_Three_VarianceY, :ndcg_Five_VarianceX, :ndcg_Five_VarianceY, :ndcg_Ten_VarianceX, :ndcg_Ten_VarianceY, :ndcg_Twenty_VarianceX, :ndcg_Twenty_VarianceY, 
                        :hr_One_X, :hr_One_Y, :hr_Three_X, :hr_Three_Y, :hr_Five_X, :hr_Five_Y, :hr_Ten_X, :hr_Ten_Y, :hr_Twenty_X, :hr_Twenty_Y, 
                        :hr_One_VarianceX, :hr_One_VarianceY, :hr_Three_VarianceX, :hr_Three_VarianceY, :hr_Five_VarianceX, :hr_Five_VarianceY, :hr_Ten_VarianceX, :hr_Ten_VarianceY, :hr_Twenty_VarianceX, :hr_Twenty_VarianceY, 
                        :recall_One_X, :recall_One_Y, :recall_Three_X, :recall_Three_Y, :recall_Five_X, :recall_Five_Y, :recall_Ten_X, :recall_Ten_Y, :recall_Twenty_X, :recall_Twenty_Y, 
                        :recall_One_VarianceX, :recall_One_VarianceY, :recall_Three_VarianceX, :recall_Three_VarianceY, :recall_Five_VarianceX, :recall_Five_VarianceY, :recall_Ten_VarianceX, :recall_Ten_VarianceY, :recall_Twenty_VarianceX, :recall_Twenty_VarianceY)
                ');
                $stmt->execute([
                    ':datasetId' => $result['datasetId'],
                    ':createdDate' => $createdDate,
                    ':ndcg_One_X' => $result['ndcg']['one']['x'],
                    ':ndcg_One_Y' => $result['ndcg']['one']['y'],
                    ':ndcg_Three_X' => $result['ndcg']['three']['x'],
                    ':ndcg_Three_Y' => $result['ndcg']['three']['y'],
                    ':ndcg_Five_X' => $result['ndcg']['five']['x'],
                    ':ndcg_Five_Y' => $result['ndcg']['five']['y'],
                    ':ndcg_Ten_X' => $result['ndcg']['ten']['x'],
                    ':ndcg_Ten_Y' => $result['ndcg']['ten']['y'],
                    ':ndcg_Twenty_X' => $result['ndcg']['twenty']['x'],
                    ':ndcg_Twenty_Y' => $result['ndcg']['twenty']['y'],
                    ':ndcg_One_VarianceX' => $result['ndcg']['one']['varianceX'],
                    ':ndcg_One_VarianceY' => $result['ndcg']['one']['varianceY'],
                    ':ndcg_Three_VarianceX' => $result['ndcg']['three']['varianceX'],
                    ':ndcg_Three_VarianceY' => $result['ndcg']['three']['varianceY'],
                    ':ndcg_Five_VarianceX' => $result['ndcg']['five']['varianceX'],
                    ':ndcg_Five_VarianceY' => $result['ndcg']['five']['varianceY'],
                    ':ndcg_Ten_VarianceX' => $result['ndcg']['ten']['varianceX'],
                    ':ndcg_Ten_VarianceY' => $result['ndcg']['ten']['varianceY'],
                    ':ndcg_Twenty_VarianceX' => $result['ndcg']['twenty']['varianceX'],
                    ':ndcg_Twenty_VarianceY' => $result['ndcg']['twenty']['varianceY'],
                    ':hr_One_X' => $result['hr']['one']['x'],
                    ':hr_One_Y' => $result['hr']['one']['y'],
                    ':hr_Three_X' => $result['hr']['three']['x'],
                    ':hr_Three_Y' => $result['hr']['three']['y'],
                    ':hr_Five_X' => $result['hr']['five']['x'],
                    ':hr_Five_Y' => $result['hr']['five']['y'],
                    ':hr_Ten_X' => $result['hr']['ten']['x'],
                    ':hr_Ten_Y' => $result['hr']['ten']['y'],
                    ':hr_Twenty_X' => $result['hr']['twenty']['x'],
                    ':hr_Twenty_Y' => $result['hr']['twenty']['y'],
                    ':hr_One_VarianceX' => $result['hr']['one']['varianceX'],
                    ':hr_One_VarianceY' => $result['hr']['one']['varianceY'],
                    ':hr_Three_VarianceX' => $result['hr']['three']['varianceX'],
                    ':hr_Three_VarianceY' => $result['hr']['three']['varianceY'],
                    ':hr_Five_VarianceX' => $result['hr']['five']['varianceX'],
                    ':hr_Five_VarianceY' => $result['hr']['five']['varianceY'],
                    ':hr_Ten_VarianceX' => $result['hr']['ten']['varianceX'],
                    ':hr_Ten_VarianceY' => $result['hr']['ten']['varianceY'],
                    ':hr_Twenty_VarianceX' => $result['hr']['twenty']['varianceX'],
                    ':hr_Twenty_VarianceY' => $result['hr']['twenty']['varianceY'],
                    ':recall_One_X' => $result['recall']['one']['x'],
                    ':recall_One_Y' => $result['recall']['one']['y'],
                    ':recall_Three_X' => $result['recall']['three']['x'],
                    ':recall_Three_Y' => $result['recall']['three']['y'],
                    ':recall_Five_X' => $result['recall']['five']['x'],
                    ':recall_Five_Y' => $result['recall']['five']['y'],
                    ':recall_Ten_X' => $result['recall']['ten']['x'],
                    ':recall_Ten_Y' => $result['recall']['ten']['y'],
                    ':recall_Twenty_X' => $result['recall']['twenty']['x'],
                    ':recall_Twenty_Y' => $result['recall']['twenty']['y'],
                    ':recall_One_VarianceX' => $result['recall']['one']['varianceX'],
                    ':recall_One_VarianceY' => $result['recall']['one']['varianceY'],
                    ':recall_Three_VarianceX' => $result['recall']['three']['varianceX'],
                    ':recall_Three_VarianceY' => $result['recall']['three']['varianceY'],
                    ':recall_Five_VarianceX' => $result['recall']['five']['varianceX'],
                    ':recall_Five_VarianceY' => $result['recall']['five']['varianceY'],
                    ':recall_Ten_VarianceX' => $result['recall']['ten']['varianceX'],
                    ':recall_Ten_VarianceY' => $result['recall']['ten']['varianceY'],
                    ':recall_Twenty_VarianceX' => $result['recall']['twenty']['varianceX'],
                    ':recall_Twenty_VarianceY' => $result['recall']['twenty']['varianceY']
                ]);
            }

            $pdo->commit();

            http_response_code(200);
            echo json_encode([
                "isSuccess" => true,
                "statusCode" => 200,
                "data" => [
                    "numberOfDatasets" => count($pcaResults)
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