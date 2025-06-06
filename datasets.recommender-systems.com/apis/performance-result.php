<?php
include_once('utils.php');

class PerformanceResult {
    public static function getPcaResults($pdo) {
        header('Content-Type: application/json');

        $stmt = $pdo->prepare("SELECT * FROM PcaResults");
        $stmt->execute();
        $pcaResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($pcaResults as $result) {
            $results[] = [
                'datasetId' => $result['DatasetId'],
                'ndcg' => [
                    'one' => [
                        'x' => (float)$result['Ndcg_One_X'],
                        'y' => (float)$result['Ndcg_One_Y'],
                        'varianceX' => (float)$result['Ndcg_One_VarianceX'],
                        'varianceY' => (float)$result['Ndcg_One_VarianceY'] 
                    ],
                    'three' => [
                        'x' => (float)$result['Ndcg_Three_X'],
                        'y' => (float)$result['Ndcg_Three_Y'],
                        'varianceX' => (float)$result['Ndcg_Three_VarianceX'],
                        'varianceY' => (float)$result['Ndcg_Three_VarianceY']
                    ],
                    'five' => [
                        'x' => (float)$result['Ndcg_Five_X'],
                        'y' => (float)$result['Ndcg_Five_Y'],
                        'varianceX' => (float)$result['Ndcg_Five_VarianceX'],
                        'varianceY' => (float)$result['Ndcg_Five_VarianceY']
                    ],
                    'ten' => [
                        'x' => (float)$result['Ndcg_Ten_X'],
                        'y' => (float)$result['Ndcg_Ten_Y'],
                        'varianceX' => (float)$result['Ndcg_Ten_VarianceX'],
                        'varianceY' => (float)$result['Ndcg_Ten_VarianceY']
                    ],
                    'twenty' => [
                        'x' => (float)$result['Ndcg_Twenty_X'],
                        'y' => (float)$result['Ndcg_Twenty_Y'],
                        'varianceX' => (float)$result['Ndcg_Twenty_VarianceX'],
                        'varianceY' => (float)$result['Ndcg_Twenty_VarianceY']
                    ]
                ],
                'hr' => [
                    'one' => [
                        'x' => (float)$result['Hr_One_X'],
                        'y' => (float)$result['Hr_One_Y'],
                        'varianceX' => (float)$result['Hr_One_VarianceX'],
                        'varianceY' => (float)$result['Hr_One_VarianceY'] 
                    ],
                    'three' => [
                        'x' => (float)$result['Hr_Three_X'],
                        'y' => (float)$result['Hr_Three_Y'],
                        'varianceX' => (float)$result['Hr_Three_VarianceX'],
                        'varianceY' => (float)$result['Hr_Three_VarianceY']
                    ],
                    'five' => [
                        'x' => (float)$result['Hr_Five_X'],
                        'y' => (float)$result['Hr_Five_Y'],
                        'varianceX' => (float)$result['Hr_Five_VarianceX'],
                        'varianceY' => (float)$result['Hr_Five_VarianceY']
                    ],
                    'ten' => [
                        'x' => (float)$result['Hr_Ten_X'],
                        'y' => (float)$result['Hr_Ten_Y'],
                        'varianceX' => (float)$result['Hr_Ten_VarianceX'],
                        'varianceY' => (float)$result['Hr_Ten_VarianceY']
                    ],
                    'twenty' => [
                        'x' => (float)$result['Hr_Twenty_X'],
                        'y' => (float)$result['Hr_Twenty_Y'],
                        'varianceX' => (float)$result['Hr_Twenty_VarianceX'],
                        'varianceY' => (float)$result['Hr_Twenty_VarianceY']
                    ]
                ],
                'recall' => [
                    'one' => [
                        'x' => (float)$result['Recall_One_X'],
                        'y' => (float)$result['Recall_One_Y'],
                        'varianceX' => (float)$result['Recall_One_VarianceX'],
                        'varianceY' => (float)$result['Recall_One_VarianceY'] 
                    ],
                    'three' => [
                        'x' => (float)$result['Recall_Three_X'],
                        'y' => (float)$result['Recall_Three_Y'],
                        'varianceX' => (float)$result['Recall_Three_VarianceX'],
                        'varianceY' => (float)$result['Recall_Three_VarianceY']
                    ],
                    'five' => [
                        'x' => (float)$result['Recall_Five_X'],
                        'y' => (float)$result['Recall_Five_Y'],
                        'varianceX' => (float)$result['Recall_Five_VarianceX'],
                        'varianceY' => (float)$result['Recall_Five_VarianceY']
                    ],
                    'ten' => [
                        'x' => (float)$result['Recall_Ten_X'],
                        'y' => (float)$result['Recall_Ten_Y'],
                        'varianceX' => (float)$result['Recall_Ten_VarianceX'],
                        'varianceY' => (float)$result['Recall_Ten_VarianceY']
                    ],
                    'twenty' => [
                        'x' => (float)$result['Recall_Twenty_X'],
                        'y' => (float)$result['Recall_Twenty_Y'],
                        'varianceX' => (float)$result['Recall_Twenty_VarianceX'],
                        'varianceY' => (float)$result['Recall_Twenty_VarianceY']
                    ]
                ],
            ];
        }

        http_response_code(200);
        echo json_encode([
            "isSuccess" => true,
            "statusCode" => 200,
            "data" => lowerFirstLetter($results)
        ]);
    }

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

    public static function getPerformanceResults($pdo, $datasetIds) {
        header('Content-Type: application/json');

        if (empty($datasetIds)) {
            http_response_code(200);
            echo json_encode([
                "isSuccess" => true,
                "statusCode" => 200,
                "data" => []
            ]);
            exit();
        }

        $ids = implode(',', array_fill(0, count($datasetIds), '?'));
        $sql = "SELECT * FROM PerformanceResults WHERE DatasetId IN ($ids)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($datasetIds);
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
            "data" => lowerFirstLetter($transformed)
        ]);
    }
}
?>