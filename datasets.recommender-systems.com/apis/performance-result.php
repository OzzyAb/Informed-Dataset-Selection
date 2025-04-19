<?php
include_once('utils.php');

class PerformanceResult {
    public static function compareAlgorithms($pdo, $x, $y) {
        header('Content-Type: application/json');
        
        $stmtX = $pdo->prepare("SELECT * FROM PerformanceResults WHERE AlgorithmId = :x");
        $stmtX->bindParam(':x', $x, PDO::PARAM_INT);
        $stmtX->execute();
        $performanceResultsX = $stmtX->fetchAll(PDO::FETCH_ASSOC);
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
        $performanceResultsY = $stmtY->fetchAll(PDO::FETCH_ASSOC);
        if (count($performanceResultsY) === 0) {
            http_response_code(404);
            echo json_encode([
                "isSuccess" => false,
                "statusCode" => 404,
                "message" => "Performance result of the algorithm with the ID of {$y} is not found"
            ]);
            exit();
        }

        $groupedX = self::groupByAlgorithmAndDataset($performanceResultsX);
        $groupedY = self::groupByAlgorithmAndDataset($performanceResultsY);

        $datasetPoints = [];
        foreach ($groupedX as $datasetId => $dataX) {
            if (isset($groupedY[$datasetId])) {
                $averagesX = [
                    'Ndcg' => self::computeColumnAverages($dataX['Ndcg'], 'Ndcg'),
                    'Hr' => self::computeColumnAverages($dataX['Hr'], 'Hr'),
                    'Recall' => self::computeColumnAverages($dataX['Recall'], 'Recall')
                ];
                $averagesY = [
                    'Ndcg' => self::computeColumnAverages($groupedY[$datasetId]['Ndcg'], 'Ndcg'),
                    'Hr' => self::computeColumnAverages($groupedY[$datasetId]['Hr'], 'Hr'),
                    'Recall' => self::computeColumnAverages($groupedY[$datasetId]['Recall'], 'Recall')
                ];
            
                $datasetPoints[] = [
                    'DatasetId' => $datasetId,
                    'X' => [
                        'Ndcg' => $averagesX['Ndcg'],
                        'Hr' => $averagesX['Hr'],
                        'Recall' => $averagesX['Recall']
                    ],
                    'Y' => [
                        'Ndcg' => $averagesY['Ndcg'],
                        'Hr' => $averagesY['Hr'],
                        'Recall' => $averagesY['Recall']
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

    private static function computeColumnAverages($results, $metricPrefix) {
        $columns = ['One', 'Three', 'Five', 'Ten', 'Twenty'];
        $averages = [];

        foreach ($columns as $column) {
            $averages[$column] = 0;
        }
    
        $count = count($results);
    
        foreach ($results as $result) {
            foreach ($columns as $column) {
                $columnName = "{$metricPrefix}_{$column}";
                $averages[$column] += isset($result[$columnName]) ? $result[$columnName] : 0;
            }
        }
    
        foreach ($columns as $column) {
            $averages[$column] = $count > 0 ? $averages[$column] / $count : 0;
        }
    
        return $averages;
    }

    private static function groupByAlgorithmAndDataset($results) {
        $groupedResults = [];
    
        foreach ($results as $result) {
            $datasetId = $result['DatasetId'];
            $algorithmId = $result['AlgorithmId'];
        
            if (!isset($groupedResults[$datasetId])) {
                $groupedResults[$datasetId] = [
                    'Ndcg' => [],
                    'Hr' => [],
                    'Recall' => []
                ];
            }
        
            $groupedResults[$datasetId]['Ndcg'][] = $result;
            $groupedResults[$datasetId]['Hr'][] = $result;
            $groupedResults[$datasetId]['Recall'][] = $result;
        }
    
        return $groupedResults;
    }
}
?>