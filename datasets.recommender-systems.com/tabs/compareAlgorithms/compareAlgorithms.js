import { ChartHelper } from "../../chartHelper.js";
import { ApiService } from "../../apiService.js";

var algorithms = null;
var datasets = null;

var firstAlgorithmElement = null;
var secondAlgorithmElement = null;
var performanceMetricElement = null;
var kValueElement = null;
var datasetFilterHeaderElement = null;
var datasetFilterArea = null;
var datasetFilterCheckboxes = [];
var canvasElement = null;
var solvedProblemsBodyElement = null;
var solvedByXBodyElement = null;
var solvedByYBodyElement = null;
var mediocresBodyElement = null;
var trueChallengesBodyElement = null;
var tableAlgoXNameElements = null;
var tableAlgoYNameElements = null;
var tableSolvedByXHeaderElements = null;
var tableSolvedByYHeaderElements = null;

var chartHelper = null;
var selectedDatasets = [];

export async function initialize() {
    firstAlgorithmElement = document.getElementById("formControlAlgorithm1");
    secondAlgorithmElement = document.getElementById("formControlAlgorithm2");
    performanceMetricElement = document.getElementById("formPerformanceMetric");
    kValueElement = document.getElementById("formKValue");
    datasetFilterHeaderElement = document.getElementById('compare-algo-filter-header');
    datasetFilterArea = document.getElementById('compare-algo-filter');
    canvasElement = document.getElementById('compare-algo-chart');
    solvedProblemsBodyElement = document.getElementById('compare-algo-solved');
    solvedByXBodyElement = document.getElementById('compare-algo-solved-by-x');
    solvedByYBodyElement = document.getElementById('compare-algo-solved-by-y');
    mediocresBodyElement = document.getElementById('compare-algo-mediocres');
    trueChallengesBodyElement = document.getElementById('compare-algo-true-challenges');
    tableAlgoXNameElements = document.querySelectorAll('.compare-algo-x-name');
    tableAlgoYNameElements = document.querySelectorAll('.compare-algo-y-name');
    tableSolvedByXHeaderElements = document.getElementById('compare-algo-solved-by-x-header');
    tableSolvedByYHeaderElements = document.getElementById('compare-algo-solved-by-y-header');

    document.getElementById('aps-redirect').addEventListener('click', apsRedirect);
   document.getElementById('compare-algo-export-btn').addEventListener('click', exportPngWithFeedback);
    document.querySelectorAll('.compareAlgorithms').forEach(element => {
        element.addEventListener('change', compareAlgorithms);
    });

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

    datasetFilterHeaderElement.innerText = '(All selected)';
    datasetFilterArea.innerHTML = '';
    selectedDatasets = [];
    datasets.forEach(dataset => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = dataset.id;
        checkbox.name = 'datasetCheckbox';
        checkbox.value = dataset.name;
        checkbox.checked = true;
        checkbox.onchange = onFilterDataset;

        const label = document.createElement('label');
        label.htmlFor = dataset.id;
        label.textContent = dataset.name;
        label.style.marginLeft = '0.25rem';

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        datasetFilterArea.appendChild(wrapper);
        datasetFilterCheckboxes.push(checkbox);
        selectedDatasets.push(dataset.id);
    });

    // Initialize all tables with custom no-data styling
    initializeEmptyTables();

    await compareAlgorithms();
}

// Helper function to initialize empty tables with custom styling
function initializeEmptyTables() {
    const tableIds = [
        'compare-algo-solved',
        'compare-algo-solved-by-x', 
        'compare-algo-solved-by-y',
        'compare-algo-mediocres',
        'compare-algo-true-challenges'
    ];
    
    tableIds.forEach(id => {
        const tbody = document.getElementById(id);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="custom-no-data">(No datasets)</td></tr>';
        }
    });
}

function apsRedirect() {
    document.getElementById('aps-tab-btn').click();
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

    const results = await ApiService.compareAlgorithms(algoId1, algoId2);
    const filteredResults = results.filter(result => selectedDatasets.includes(result.datasetId));
    const separatedResults = separateResults(filteredResults.map((result) => {
        return {
            id: result.datasetId,
            x: result.x[performanceMetric][kValue],
            y: result.y[performanceMetric][kValue]
        }
    }));

    drawChart(filteredResults, separatedResults, algoName1, algoName2, performanceMetricName, kValueName);
    fillTables(separatedResults, algoName1, algoName2);
}

async function onFilterDataset(e) {
    const datasetId = Number(e.target.id);
    if (e.target.checked) {
        selectedDatasets.push(datasetId);

        if (selectedDatasets.length === datasets.length) {
            datasetFilterHeaderElement.innerText = '(All selected)';
        }
        else {
            datasetFilterHeaderElement.innerText = '(Some selected)';
        }
    }
    else {
        const index = selectedDatasets.indexOf(datasetId);
        selectedDatasets.splice(index, 1);

        if (selectedDatasets.length === 0) {
            datasetFilterHeaderElement.innerText = '(None selected)';
        }
        else {
            datasetFilterHeaderElement.innerText = '(Some selected)';
        }
    }

    await compareAlgorithms();
}

function separateResults(filteredResults) {
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

    filteredResults.forEach((result) => {
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

function drawChart(filteredResults, separatedResults, algoName1, algoName2, performanceMetricName, kValueName) {
    chartHelper.createChart(canvasElement, {
        datasets: [
            {
                label: 'True Challenges',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(255, 30, 0)',
                pointBorderWidth: 0,
                data: separatedResults.trueChallenges
            },
            {
                label: 'Solved Problems',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(0, 150, 30)',
                pointBorderWidth: 0,
                data: separatedResults.solvedProblems
            },
            {
                label: `Solved By ${algoName1}`,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(0, 70, 128)',
                pointBorderWidth: 0,
                data: separatedResults.solvedByAlgo1
            },
            {
                label: `Solved By ${algoName2}`,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(180, 180, 0)',
                pointBorderWidth: 0,
                data: separatedResults.solvedByAlgo2
            },
            {
                label: 'Mediocres',
                pointRadius: 5,
                pointBackgroundColor: 'rgb(150, 150, 150)',
                pointBorderWidth: 0,
                data: separatedResults.mediocres
            }
        ],
        title: `Performance of ${algoName1} and ${algoName2} (${performanceMetricName}${kValueName})`,
        axisTitles: {
            x: {
                text: `Performance of ${algoName1}`,
                size: 14,
                bold: true
            },
            y: {
                text: `Performance of ${algoName2}`,
                size: 14,
                bold: true
            }
        },
        labels: {
            showX: true,
            showY: true,
            customLabels: filteredResults.reduce((data, result) => {
                const dataset = datasets.find(dataset => dataset.id == result.datasetId);
                data[dataset.id] = dataset.name;
                return data;
            }, {})
        },
        legend: {
            show: true
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

function exportPng() {
    const algoName1 = firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text.toLowerCase();
    const algoName2 = secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text.toLowerCase();
    const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text.toLowerCase();
    const kValueName = kValueElement.options[kValueElement.selectedIndex].text.toLowerCase();

    chartHelper.exportChartAsPng(`comparison-${algoName1}-${algoName2}-${performanceMetricName}${kValueName}`, canvasElement);
}
//Enhanced export function with user feedback 
async function exportPngWithFeedback() {
    const exportBtn = document.getElementById('compare-algo-export-btn');
    const originalText = exportBtn.textContent;
    
    try {
        // Update button to show process is starting
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
        
        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the filename dynamically like the original exportPng function
        const algoName1 = firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text.toLowerCase();
        const algoName2 = secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text.toLowerCase();
        const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text.toLowerCase();
        const kValueName = kValueElement.options[kValueElement.selectedIndex].text.toLowerCase();
        
        // Call the export function with the same naming convention
        chartHelper.exportChartAsPng(`comparison-${algoName1}-${algoName2}-${performanceMetricName}${kValueName}`, canvasElement);
        
        // Show success feedback
        exportBtn.textContent = 'Exported!';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Export failed:', error);
        // Show error feedback
        exportBtn.textContent = 'Export Failed';
        
        // Reset button after 3 seconds
        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }, 3000);
    }
}

function fillTables(separatedResults, algoName1, algoName2) {
    // Updated fill function to use custom-no-data class
    function fill(tableBodyElement, results) {
        if (results.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');

            td.colSpan = 3;
            td.className = 'custom-no-data'; // Use custom class instead of inline styles
            td.textContent = "(No datasets)";

            tr.appendChild(td);
            tableBodyElement.appendChild(tr);
        }
        else {
            results.forEach(result => {
                const dataset = datasets.find(dataset => dataset.id === result.id);

                const tr = document.createElement('tr');
                const tdDataset = document.createElement('td');
                const tdX = document.createElement('td');
                const tdY = document.createElement('td');

                // Removed inline styles to let custom CSS handle styling
                tdDataset.textContent = dataset.name;
                tdX.textContent = result.x.toFixed(5);
                tdY.textContent = result.y.toFixed(5);

                tr.appendChild(tdDataset);
                tr.appendChild(tdX);
                tr.appendChild(tdY);
                tableBodyElement.appendChild(tr);
            });
        }
    }

    // Clear all table bodies
    solvedProblemsBodyElement.innerHTML = '';
    solvedByXBodyElement.innerHTML = '';
    solvedByYBodyElement.innerHTML = '';
    mediocresBodyElement.innerHTML = '';
    trueChallengesBodyElement.innerHTML = '';

    // Update algorithm names in headers
    tableSolvedByXHeaderElements.textContent = 'Solved By ' + algoName1;
    tableAlgoXNameElements.forEach(element => {
        element.textContent = algoName1;
    });
    tableSolvedByYHeaderElements.textContent = 'Solved By ' + algoName2;
    tableAlgoYNameElements.forEach(element => {
        element.textContent = algoName2;
    });

    // Fill all tables with data or empty state
    fill(solvedProblemsBodyElement, separatedResults.solvedProblems);
    fill(solvedByXBodyElement, separatedResults.solvedByAlgo1);
    fill(solvedByYBodyElement, separatedResults.solvedByAlgo2);
    fill(mediocresBodyElement, separatedResults.mediocres);
    fill(trueChallengesBodyElement, separatedResults.trueChallenges);
}

export function dispose() {
    document.getElementById('aps-redirect').removeEventListener('click', apsRedirect);
     document.getElementById('compare-algo-export-btn').removeEventListener('click', exportPngWithFeedback);
    document.querySelectorAll('.compareAlgorithms').forEach(element => {
        element.removeEventListener('change', compareAlgorithms);
    });
}