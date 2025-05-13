var algorithms = null;
var datasets = null;

var firstAlgorithmElement = null;
var secondAlgorithmElement = null;
var performanceMetricElement = null;
var kValueElement = null;
var canvasElement = null;

var chartHelper = null;

async function initialize() {
    firstAlgorithmElement = document.getElementById("formControlAlgorithm1");
    secondAlgorithmElement = document.getElementById("formControlAlgorithm2");
    performanceMetricElement = document.getElementById("formPerformanceMetric");
    kValueElement = document.getElementById("formKValue");
    canvasElement = document.getElementById('compare-algo-chart');

    chartHelper = new ChartHelper();

    algorithms = await ApiService.getAlgorithms();
    datasets = await ApiService.getDatasets();

    // Clear existing options
    firstAlgorithmElement.innerHTML = "";
    secondAlgorithmElement.innerHTML = "";

    algorithms.forEach((algorithm) => {
        // Create a new option for the first select
        const option1 = document.createElement("option");
        option1.value = algorithm.id;
        option1.textContent = algorithm.name;
        firstAlgorithmElement.appendChild(option1);

        // Create a new option for the second select
        const option2 = document.createElement("option");
        option2.value = algorithm.id;
        option2.textContent = algorithm.name;
        secondAlgorithmElement.appendChild(option2);
    });

    // Select the first two algorithms by default
    firstAlgorithmElement.value = algorithms[0].id;
    if (algorithms.length > 1) {
        secondAlgorithmElement.value = algorithms[1].id;
    }
    else {
        secondAlgorithmElement.value = algorithms[0].id;
    }

    await compareAlgorithms();
}

async function compareAlgorithms() {
    const algoId1 = Number(firstAlgorithmElement.value);
    const algoId2 = Number(secondAlgorithmElement.value);
    const algoName1 = firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text;
    const algoName2 = secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text;
    const performanceMetric = performanceMetricElement.value;
    const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text;
    const kValue = kValueElement.value;
    const kValueName = kValueElement.options[kValueElement.selectedIndex].text;

    const results = await ApiService.getPerformanceResults(algoId1, algoId2);
    const { trueChallenges, solvedProblems, solvedByAlgo1, solvedByAlgo2, mediocres } = separateResults(results.map((result) => {
        return {
            x: result.x[performanceMetric][kValue],
            y: result.y[performanceMetric][kValue]
        }
    }));

    chartHelper.createChart(canvasElement, {
        datasets: [
            {
                label: 'True Challenges',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(255, 30, 0)',
                pointBorderWidth: 0,
                data: trueChallenges
            },
            {
                label: 'Solved Problems',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(0, 150, 30)',
                pointBorderWidth: 0,
                data: solvedProblems
            },
            {
                label: `Solved By ${algoName1}`,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(0, 70, 128)',
                pointBorderWidth: 0,
                data: solvedByAlgo1
            },
            {
                label: `Solved By ${algoName2}`,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(180, 180, 0)',
                pointBorderWidth: 0,
                data: solvedByAlgo2
            },
            {
                label: 'Mediocres',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(150, 150, 150)',
                pointBorderWidth: 0,
                data: mediocres
            }
        ],
        title: `Performance of ${algoName1} and ${algoName2} (${performanceMetricName}${kValueName})`,
        labels: {
            showX: true,
            showY: true,
            customLabels: [
                results.map((result) => datasets.find((dataset) => dataset.id === result.datasetId).name)
            ]
        },
        legend: {
            showDefault: true
        },
        shapes: [
            {
                type: 'line',
                style: 'dashed',
                features: [
                    false,
                    0, 0.5,
                    0.5, 1,
                    1, 0.5,
                    0.5, 0,
                    0, 0.5
                ]
            },
            {
                type: 'line',
                fillColor: 'rgba(255, 0, 0, 0.4)',
                features: [
                    true,
                    0, 0,
                    0, 0.5,
                    0.5, 0
                ]
            },
            {
                type: 'line',
                fillColor: 'rgba(0, 255, 30, 0.4)',
                features: [
                    true,
                    1, 1,
                    1, 0.5,
                    0.5, 1
                ]
            },
            {
                type: 'line',
                fillColor: 'rgba(0, 130, 255, 0.3)',
                features: [
                    true,
                    0.5, 0,
                    1, 0,
                    1, 0.5
                ]
            },
            {
                type: 'line',
                fillColor: 'rgba(255, 255, 0, 0.4)',
                features: [
                    true,
                    0, 0.5,
                    0.5, 1,
                    0, 1
                ]
            },
            {
                type: 'line',
                fillColor: 'rgba(230, 230, 230, 0.4)',
                features: [
                    true,
                    0, 0.5,
                    0.5, 1,
                    1, 0.5,
                    0.5, 0
                ]
            }
        ]
    });
}

function separateResults(results) {
    function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        function triangleArea(x1, y1, x2, y2, x3, y3) {
            return Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2;
        }

        const areaABC = triangleArea(ax, ay, bx, by, cx, cy);
        const areaPAB = triangleArea(px, py, ax, ay, bx, by);
        const areaPBC = triangleArea(px, py, bx, by, cx, cy);
        const areaPCA = triangleArea(px, py, cx, cy, ax, ay);

        return Math.abs(areaABC - (areaPAB + areaPBC + areaPCA)) < 1e-9;
    }

    const trueChallenges = [];
    const solvedProblems = [];
    const solvedByAlgo1 = [];
    const solvedByAlgo2 = [];
    const mediocres = [];

    results.forEach((result) => {
        if (isPointInTriangle(result.x, result.y, 0, 0, 0, 0.5, 0.5, 0)) {
            trueChallenges.push(result);
        }
        else if (isPointInTriangle(result.x, result.y, 1, 1, 1, 0.5, 0.5, 1)) {
            solvedProblems.push(result);
        }
        else if (isPointInTriangle(result.x, result.y, 0.5, 0, 1, 0, 1, 0.5)) {
            solvedByAlgo1.push(result);
        }
        else if (isPointInTriangle(result.x, result.y, 0, 0.5, 0, 1, 0.5, 1)) {
            solvedByAlgo2.push(result);
        }
        else {
            mediocres.push(result);
        }
    });

    return { trueChallenges, solvedProblems, solvedByAlgo1, solvedByAlgo2, mediocres };
}


