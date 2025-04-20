<?php
include_once('utils.php');

class PerformanceResult {
    public static function compareAlgorithms($pdo, $x, $y) {
        header('Content-Type: application/json');
        
        $stmtX = $pdo->prepare("SELECT * FROM PerformanceResults WHERE AlgorithmId = :x");
        $stmtX->bindParam(':x', $x, PDO::PARAM_INT);
        $stmtX->execute();
        $performanceResultsX = $stmtX->fetchAll(PDO::FETCH_OBJ);
        if (count($performanceResultsX) === 0) {
            http_response_code(404);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 404,
                "message" => "Performance result of the algorithm with the ID of {$x} is not found"
            ]);
            exit();
        }

        $stmtY = $pdo->prepare("SELECT * FROM PerformanceResults WHERE AlgorithmId = :y");
        $stmtY->bindParam(':y', $y, PDO::PARAM_INT);
        $stmtY->execute();
        $performanceResultsY = $stmtY->fetchAll(PDO::FETCH_OBJ);
        if (count($performanceResultsY) === 0) {
            http_response_code(404);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 404,
                "message" => "Performance result of the algorithm with the ID of {$y} is not found"
            ]);
            exit();
        }

        $datasetIdsX = array_map(fn($prX) => $prX->DatasetId, $performanceResultsX);
        $datasetIdsY = array_map(fn($prY) => $prY->DatasetId, $performanceResultsY);
        $commonDatasetIds = array_intersect($datasetIdsX, $datasetIdsY);
        
        $performanceResultsX = array_filter($performanceResultsX, fn($prX) => in_array($prX->DatasetId, $commonDatasetIds));
        $performanceResultsY = array_filter($performanceResultsY, fn($prY) => in_array($prY->DatasetId, $commonDatasetIds));

        $performanceResultsX = array_merge($performanceResultsX, $performanceResultsY);
        $groupedByDatasetId = [];
        foreach ($performanceResultsX as $result) {
            $groupedByDatasetId[$result->DatasetId][] = $result;
        }

        $datasetPoints = [];
        foreach ($groupedByDatasetId as $datasetId => $group) {
            foreach ($group as $item) {
                if ($item->AlgorithmId == $x) {
                    $algorithmX = $item;
                }
                else if ($item->AlgorithmId == $y) {
                    $algorithmY = $item;
                }
            }

            if ($algorithmX && $algorithmY) {
                $datasetPoints[] = [
                    'DatasetId' => $datasetId,
                    'X' => [
                        'Ndcg' => [
                            'One' =>  $algorithmX->Ndcg_One,
                            'Three' =>  $algorithmX->Ndcg_Three,
                            'Five' =>  $algorithmX->Ndcg_Five,
                            'Ten' =>  $algorithmX->Ndcg_Ten,
                            'Twenty' =>  $algorithmX->Ndcg_Twenty,
                        ],
                        'Hr' => [
                            'One' =>  $algorithmX->Hr_One,
                            'Three' =>  $algorithmX->Hr_Three,
                            'Five' =>  $algorithmX->Hr_Five,
                            'Ten' =>  $algorithmX->Hr_Ten,
                            'Twenty' =>  $algorithmX->Hr_Twenty,
                        ],
                        'Recall' => [
                            'One' =>  $algorithmX->Recall_One,
                            'Three' =>  $algorithmX->Recall_Three,
                            'Five' =>  $algorithmX->Recall_Five,
                            'Ten' =>  $algorithmX->Recall_Ten,
                            'Twenty' =>  $algorithmX->Recall_Twenty,
                        ],
                    ],
                    'Y' => [
                        'Ndcg' => [
                            'One' =>  $algorithmY->Ndcg_One,
                            'Three' =>  $algorithmY->Ndcg_Three,
                            'Five' =>  $algorithmY->Ndcg_Five,
                            'Ten' =>  $algorithmY->Ndcg_Ten,
                            'Twenty' =>  $algorithmY->Ndcg_Twenty,
                        ],
                        'Hr' => [
                            'One' =>  $algorithmY->Hr_One,
                            'Three' =>  $algorithmY->Hr_Three,
                            'Five' =>  $algorithmY->Hr_Five,
                            'Ten' =>  $algorithmY->Hr_Ten,
                            'Twenty' =>  $algorithmY->Hr_Twenty,
                        ],
                        'Recall' => [
                            'One' =>  $algorithmY->Recall_One,
                            'Three' =>  $algorithmY->Recall_Three,
                            'Five' =>  $algorithmY->Recall_Five,
                            'Ten' =>  $algorithmY->Recall_Ten,
                            'Twenty' =>  $algorithmY->Recall_Twenty,
                        ],
                    ]
                ];
            }
        }

        echo json_encode([
            "isSuccess" => true,
            "statusCode" => 200,
            "data" => lowerFirstLetter($datasetPoints)
        ]);
    }
}
?>