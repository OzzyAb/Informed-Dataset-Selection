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

$x = isset($_GET['x']) ? $_GET['x'] : null;
$y = isset($_GET['y']) ? $_GET['y'] : null;
if ($x === null || $y === null) {
    http_response_code(404);
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 404,
        "message" => "Query parameters are missing"
    ]);
    exit();
}
if (!is_numeric($x) || !is_numeric($y)) {
    http_response_code(400);
    echo json_encode([
        "isSuccess" => false,
        "statusCode" => 400,
        "message" => "Wrong query parameter"
    ]);
    exit();
}

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

function computeColumnAverages($results, $metricPrefix) {
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

function groupByAlgorithmAndDataset($results) {
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

$groupedX = groupByAlgorithmAndDataset($performanceResultsX);
$groupedY = groupByAlgorithmAndDataset($performanceResultsY);

$datasetPoints = [];
foreach ($groupedX as $datasetId => $dataX) {
    if (isset($groupedY[$datasetId])) {
        $averagesX = [
            'Ndcg' => computeColumnAverages($dataX['Ndcg'], 'Ndcg'),
            'Hr' => computeColumnAverages($dataX['Hr'], 'Hr'),
            'Recall' => computeColumnAverages($dataX['Recall'], 'Recall')
        ];
        $averagesY = [
            'Ndcg' => computeColumnAverages($groupedY[$datasetId]['Ndcg'], 'Ndcg'),
            'Hr' => computeColumnAverages($groupedY[$datasetId]['Hr'], 'Hr'),
            'Recall' => computeColumnAverages($groupedY[$datasetId]['Recall'], 'Recall')
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
    "data" => $datasetPoints
]);
?>
