import { ChartHelper } from "../../chartHelper.js";
import { ApiService } from "../../apiService.js";
import { PCA } from 'https://cdn.skypack.dev/ml-pca';

var datasets = null;
var algorithms = null;

var performanceMetricElement = null;
var kValueElement = null;
var algorithmFilterHeaderElement = null;
var algorithmFilterArea = null;
var algorithmFilterCheckboxes = [];
var datasetFilterHeaderElement = null;
var datasetFilterArea = null;
var datasetFilterCheckboxes = [];
var updatePcaButton = null;
var updatePcaTextStale = null;
var updatePcaTextCalculating = null;
var canvasElement = null;
var similarityElement = null;
var difficultyElement = null;

var chartHelper = null;
var selectedAlgorithms = [];
var selectedDatasets = [];

var lastMetricSelection = null;
var lastKValueSelection = null;
var lastAlgorithmFilter = [];
var lastDatasetFilter = [];

export async function initialize() {
    performanceMetricElement = document.getElementById("formPerformanceMetricPca");
    kValueElement = document.getElementById("formKValuePca");
    algorithmFilterHeaderElement = document.getElementById('aps-algorithm-filter-header');
    algorithmFilterArea = document.getElementById('aps-algorithm-filter');
    datasetFilterHeaderElement = document.getElementById('aps-dataset-filter-header');
    datasetFilterArea = document.getElementById('aps-dataset-filter');
    updatePcaButton = document.getElementById('aps-update-pca-btn');
    updatePcaTextStale = document.getElementById('aps-update-pca-txt-stale');
    updatePcaTextCalculating = document.getElementById('aps-update-pca-txt-calculating');
    canvasElement = document.getElementById('aps-chart');
    similarityElement = document.getElementById('similar-datasets');
    difficultyElement = document.getElementById('dataset-difficulty');

    updatePcaButton.addEventListener('click', updatePca);
    document.getElementById('aps-reset-graph-btn').addEventListener('click', resetGraph);
    document.getElementById('aps-export-png-btn').addEventListener('click', exportPngWithFeedback);
    document.querySelectorAll('.aps-selection').forEach(element => {
        element.addEventListener('change', checkStaleData);
    });

    chartHelper = new ChartHelper();

    datasets = await ApiService.getDatasets();
    algorithms = await ApiService.getAlgorithms();

    algorithmFilterHeaderElement.innerText = '(All selected)';
    algorithmFilterArea.innerHTML = '';
    algorithms.forEach(algorithm => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `algorithm-${algorithm.id}`;
        checkbox.name = 'algorithmCheckbox';
        checkbox.value = algorithm.name;
        checkbox.checked = true;
        checkbox.onchange = onFilterAlgorithm;

        const label = document.createElement('label');
        label.htmlFor = `algorithm-${algorithm.id}`;
        label.textContent = algorithm.name;
        label.style.marginLeft = '0.25rem';

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        algorithmFilterArea.appendChild(wrapper);
        algorithmFilterCheckboxes.push(checkbox);
        selectedAlgorithms.push(algorithm.id);
    });

    datasetFilterHeaderElement.innerText = '(All selected)';
    datasetFilterArea.innerHTML = '';
    datasets.forEach(dataset => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `dataset-${dataset.id}`;
        checkbox.name = 'datasetCheckbox';
        checkbox.value = dataset.name;
        checkbox.checked = true;
        checkbox.onchange = onFilterDataset;

        const label = document.createElement('label');
        label.htmlFor = `dataset-${dataset.id}`;
        label.textContent = dataset.name;
        label.style.marginLeft = '0.25rem';

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        datasetFilterArea.appendChild(wrapper);
        datasetFilterCheckboxes.push(checkbox);
        selectedDatasets.push(dataset.id);
    });

    lastMetricSelection = 'ndcg';
    lastKValueSelection = 'one';
    lastAlgorithmFilter = [...selectedAlgorithms];
    lastDatasetFilter = [...selectedDatasets];

    checkStaleData();
    await updatePca();
}

function checkStaleData() {
    function isSelectionEqual(lastSelection, currentSelection) {
        if (lastSelection.length !== currentSelection.length)
            return false;

        const sortedLastSelection = [...lastSelection].sort((a, b) => a - b);
        const sortedCurrentSelection = [...currentSelection].sort((a, b) => a - b);

        return sortedLastSelection.every((val, index) => val === sortedCurrentSelection[index]);
    }

    if (lastMetricSelection !== performanceMetricElement.value ||
        lastKValueSelection !== kValueElement.value ||
        lastAlgorithmFilter.length !== selectedAlgorithms.length ||
        lastDatasetFilter.length !== selectedDatasets.length ||
        !isSelectionEqual(lastAlgorithmFilter, selectedAlgorithms) ||
        !isSelectionEqual(lastDatasetFilter, selectedDatasets)
    ) {
        updatePcaButton.disabled = false;
        updatePcaTextStale.style.display = 'block';
    }
    else {
        updatePcaButton.disabled = true;
        updatePcaTextStale.style.display = 'none';
    }
}

async function updatePca() {
    // Show loading
    updatePcaButton.disabled = true;
    updatePcaTextStale.style.display = 'none';
    updatePcaTextCalculating.style.display = 'block';

    // Get selected values
    const performanceMetric = performanceMetricElement.value;
    const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text;
    const kValue = kValueElement.value;
    const kValueName = kValueElement.options[kValueElement.selectedIndex].text;

    // Get performance results from the DB
    let filteredResults;
    if (selectedAlgorithms.length === algorithms.length &&
        selectedDatasets.length === datasets.length
    ) {
        // No filter is applied. Get the PCA results directly from the backend
        const results = await ApiService.getPcaResults();
        filteredResults = results.map(result => {
            return {
                id: result.datasetId,
                x: result[performanceMetric][kValue].x,
                y: result[performanceMetric][kValue].y,
                ellipseX: result[performanceMetric][kValue].varianceX,
                ellipseY: result[performanceMetric][kValue].varianceY,
            };
        });
    }
    else {
        // Get the performance results from the backend calculate the PCA locally
        const performanceResults = await ApiService.getPerformanceResults(selectedDatasets, selectedAlgorithms);
        
        const X = selectedDatasets.map(datasetId => {
            return selectedAlgorithms.map(algorithmId => {
                const value = performanceResults[datasetId]?.[algorithmId]?.[performanceMetric]?.[kValue];
                return value != null ? value : NaN;
            });
        });

        const nRows = X.length;
        const nCols = X[0].length;
        const colMeans = [];
        for (let c = 0; c < nCols; c++) {
            let sum = 0, count = 0;
            for (let r = 0; r < nRows; r++) {
                if (!Number.isNaN(X[r][c])) {
                    sum += X[r][c];
                    count++;
                }
            }
            colMeans[c] = count > 0 ? sum / count : 0;
        }

        const X_imputed = X.map(row => row.map((v, c) => Number.isNaN(v) ? colMeans[c] : v));
        const pca = new PCA(X_imputed, { center: true, scale: false });
        const X_pca = pca.predict(X_imputed).data.map(arr => Array.from(arr));

        const results = selectedDatasets.map((datasetId, i) => {
            const points = selectedAlgorithms.map((algorithmId, algIdx) => {
                const rowVector = new Array(nCols).fill(NaN);
                const val = performanceResults[datasetId]?.[algorithmId]?.[performanceMetric]?.[kValue];
                rowVector[algIdx] = val != null ? val : NaN;
                const imputedRow = rowVector.map((v, idx) => Number.isNaN(v) ? pca.means[idx] : v);
                const prediction = pca.predict([imputedRow]);
                return prediction.data[0];
            });

            let varianceX = 0, varianceY = 0;
            if (points.length > 1) {
                const xs = points.map(p => p[0]);
                const ys = points.map(p => p[1]);
                const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
                const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
                varianceX = Math.sqrt(xs.reduce((acc, v) => acc + (v - meanX) ** 2, 0) / xs.length);
                varianceY = Math.sqrt(ys.reduce((acc, v) => acc + (v - meanY) ** 2, 0) / ys.length);
            }

            return {
                datasetId: datasetId,
                x: X_pca[i][0],
                y: -X_pca[i][1], // This PCA code's output is mirrored horizontally compared to the Python script! That's why it's minus
                varianceX,
                varianceY
            };
        });

        filteredResults = results.map(result => {
            return {
                id: result.datasetId,
                x: result.x,
                y: result.y,
                ellipseX: result.varianceX,
                ellipseY: result.varianceY,
            };
        });
    }

    // Get PCA results from the DB to calculate difficulties and similarities
    const pcaResults = await ApiService.getPcaResults();
    const mappedPcaResults = pcaResults.map(result => {
        return {
            id: result.datasetId,
            x: result[performanceMetric][kValue].x,
            y: result[performanceMetric][kValue].y,
        }
    });

    const pcaMinX = Math.min(...mappedPcaResults.map(result => result.x));
    const pcaMaxX = Math.max(...mappedPcaResults.map(result => result.x));
    const pcaMinY = Math.min(...mappedPcaResults.map(result => result.y));
    const pcaMaxY = Math.max(...mappedPcaResults.map(result => result.y));

    showDatasetDifficulties(mappedPcaResults, filteredResults, pcaMinX, pcaMaxX, pcaMinY, pcaMaxY);
    showSimilarDatasets(filteredResults);

    // Draw the chart
    const minX = Math.min(...filteredResults.map(result => result.x));
    const maxX = Math.max(...filteredResults.map(result => result.x));
    const minY = Math.min(...filteredResults.map(result => result.y));
    const maxY = Math.max(...filteredResults.map(result => result.y));

    drawChart(filteredResults, mappedPcaResults, performanceMetricName, kValueName,
        minX, maxX, minY, maxY, pcaMinX, pcaMaxX, pcaMinY, pcaMaxY);
    
    // Save the last selections
    lastMetricSelection = performanceMetric;
    lastKValueSelection = kValue;
    lastAlgorithmFilter = [...selectedAlgorithms];
    lastDatasetFilter = [...selectedDatasets];
    checkStaleData();

    // Hide loading text
    updatePcaTextCalculating.style.display = 'none';
}

function onFilterAlgorithm(e) {
    const algorithmId = Number(e.target.id.split('-')[1]);
    if (e.target.checked) {
        selectedAlgorithms.push(algorithmId);

        if (selectedAlgorithms.length === algorithms.length) {
            algorithmFilterHeaderElement.innerText = '(All selected)';
        }
        else {
            algorithmFilterHeaderElement.innerText = '(Some selected)';
        }
    }
    else {
        const index = selectedAlgorithms.indexOf(algorithmId);
        selectedAlgorithms.splice(index, 1);

        if (selectedAlgorithms.length === 0) {
            algorithmFilterHeaderElement.innerText = '(None selected)';
        }
        else {
            algorithmFilterHeaderElement.innerText = '(Some selected)';
        }
    }

    checkStaleData();
}

function onFilterDataset(e) {
    const datasetId = Number(e.target.id.split('-')[1]);
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

    checkStaleData();
}

function drawChart(filteredResults, mappedPcaResults, performanceMetricName, kValueName, 
    minX, maxX, minY, maxY, pcaMinX, pcaMaxX, pcaMinY, pcaMaxY) {
    const difficultyBarTopColor = 'rgb(253, 196, 125)';

    function getDatasetDifficultyColor(point, minX, maxX, minY, maxY) {
        let topColor = [];
        let topColorStart = difficultyBarTopColor.indexOf('rgb');
        let topColorOpen = difficultyBarTopColor.indexOf('(', topColorStart);
        let topColorClose = difficultyBarTopColor.indexOf(')', topColorOpen);
        let topColorValues = difficultyBarTopColor.slice(topColorOpen + 1, topColorClose).split(',').map(v => v.trim());
        topColor.push(Number(topColorValues[0]));
        topColor.push(Number(topColorValues[1]));
        topColor.push(Number(topColorValues[2]));

        let normX = (point.x - minX) / (maxX - minX);
        let normY = (point.y - minY) / (maxY - minY);
        normX = Math.min(Math.max(normX, 0), 1);
        normY = Math.min(Math.max(normY, 0), 1);
        const ratio = (normX + normY) / 2;

        const r = Math.round(topColor[0] * (1 - ratio));
        const g = Math.round(topColor[1] * (1 - ratio));
        const b = Math.round(topColor[2] * (1 - ratio));
        return `rgb(${r}, ${g}, ${b})`;
    }

   chartHelper.createChart(canvasElement, {
        datasets: [
        // Removed the dataset diffuclty legend 

            {
                label: 'Datasets',
                pointRadius: 5,
                pointBackgroundColor: filteredResults.map(result => getDatasetDifficultyColor(mappedPcaResults.find(x => x.id === result.id), pcaMinX, pcaMaxX, pcaMinY, pcaMaxY)),
                pointBorderWidth: 0,
                backgroundColor: 'red',
                data: filteredResults
            },
            {
                label: 'Variances',
                pointBackgroundColor: 'rgb(255, 0, 0)',
            }
        ],
        drawEllipseAroundDots: {
            show: true,
            color: 'rgba(255, 0, 0, 0.5)',
            legendTitle: 'Variances'
        },
        verticalGradientBar: {
            topColor: difficultyBarTopColor,
            topText: '1.0',
            bottomText: '0.0',
            verticalText: 'Dataset Difficulty'
        },
        title: `Algorithm Performance Space (${performanceMetricName}${kValueName})`,
        axisTitles: {
            x: {
                text: 'Component 1',
                size: 14,
                bold: true
            },
            y: {
                text: 'Component 2',
                size: 14,
                bold: true
            }
        },
        labels: {
            showX: true,
            showY: true,
            customLabels: filteredResults.reduce((data, result) => {
                const dataset = datasets.find(dataset => dataset.id == result.id);
                data[dataset.id] = dataset.name;
                return data;
            }, {})
        },
        legend: {
            show: true
        },
        zoom: true,
        points: {
            x: {
                min: minX - 0.1,
                max: maxX + 0.1,
                stepSize: 0.1,
            },
            y: {
                min: minY - 0.1,
                max: maxY + 0.1,
                stepSize: 0.1
            }
        },
    });
}

function resetGraph() {
    chartHelper.resetChart(canvasElement);
}

function exportPng() {
    chartHelper.exportChartAsPng('aps', canvasElement);
}
// Enhanced export function with user feedback to show the process is working
async function exportPngWithFeedback() {
    const exportBtn = document.getElementById('aps-export-png-btn');
    const originalText = exportBtn.textContent;
    
    try {
        // Update button to show process is starting
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
        
        // Small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Call the export function
        chartHelper.exportChartAsPng('aps', canvasElement);
        
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

function showSimilarDatasets(filteredResults) {
    // Find similar datasets
    const result = {};

    for (let i = 0; i < filteredResults.length; i++) {
        const a = filteredResults[i];
        const similar = [];

        for (let j = 0; j < filteredResults.length; j++) {
            if (i === j)
                continue;

            const b = filteredResults[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const varX = (a.ellipseX ?? 0) ** 2 + (b.ellipseX ?? 0) ** 2;
            const varY = (a.ellipseY ?? 0) ** 2 + (b.ellipseY ?? 0) ** 2;

            if (varX === 0 || varY === 0)
                continue;

            const distance = Math.sqrt((dx * dx) / varX + (dy * dy) / varY);
            const confidence = Math.exp(-distance);
            if (confidence > 0.01) {
                similar.push({
                    id: b.id,
                    confidence: parseFloat(confidence.toFixed(3)),
                });
            }
        }

        result[a.id] = similar;
    }

    // Show similarities
    similarityElement.innerHTML = '';
    Object.entries(result).forEach(([id, similarList]) => {
        const collapseId = `collapse${id}`;
        const headingId = `heading${id}`;

        const wrapper = document.createElement("div");
        wrapper.className = "accordion";
        wrapper.style.marginBottom = "1rem";

        const item = document.createElement("div");
        item.className = "accordion-item";

        const h2 = document.createElement("h2");
        h2.className = "accordion-header";
        h2.id = headingId;

        const button = document.createElement("button");
        button.className = "accordion-button collapsed";
        button.type = "button";
        button.setAttribute("data-bs-toggle", "collapse");
        button.setAttribute("data-bs-target", `#${collapseId}`);
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", collapseId);
        button.textContent = datasets.find(dataset => dataset.id == id).name;

        h2.appendChild(button);

        const collapse = document.createElement("div");
        collapse.id = collapseId;
        collapse.className = "accordion-collapse collapse";
        collapse.setAttribute("aria-labelledby", headingId);
        collapse.setAttribute("data-bs-parent", "#accordionAPSAlgo");

        const body = document.createElement("div");
        body.className = "accordion-body";
        body.style.display = "flex";
        body.style.flexWrap = "wrap";
        body.style.gap = "1rem";

        if (similarList.length === 0) {
            const noSimilar = document.createElement("span");
            noSimilar.textContent = "(No similar datasets)";
            body.appendChild(noSimilar);
        } else {
            similarList.sort((a, b) => b.confidence - a.confidence).forEach(({ id: simId, confidence }) => {
                const badge = document.createElement("span");
                const { label, className } = getConfidence(confidence);
                badge.className = `badge ${className}`;
                const name = datasets.find(dataset => dataset.id == simId).name;
                badge.textContent = `${name} (${label}: ${confidence.toFixed(2)})`;
                body.appendChild(badge);
            });
        }

        collapse.appendChild(body);
        item.appendChild(h2);
        item.appendChild(collapse);
        wrapper.appendChild(item);
        similarityElement.appendChild(wrapper);
    });
}

function showDatasetDifficulties(mappedPcaResults, filteredResults, minX, maxX, minY, maxY) {
    difficultyElement.innerHTML = '';

    mappedPcaResults.forEach(result => {
        if (filteredResults.find(r => r.id === result.id) == undefined)
            return;

        const dataset = datasets.find(d => d.id === result.id);

        const normX = (result.x - minX) / (maxX - minX);
        const normY = (result.y - minY) / (maxY - minY);

        const difficultyScore = (normX + normY) / 2;
        const difficultyPercent = Math.round(difficultyScore * 100);
        const difficultyDisplay = difficultyScore.toFixed(5);

        let level = '', color = '';
        if (difficultyScore >= 0.7) {
            level = 'Very Easy';
            color = 'bg-success';
        }
        else if (difficultyScore >= 0.4) {
            level = 'Easy';
            color = 'bg-primary';
        }
        else if (difficultyScore >= 0.3) {
            level = 'Medium';
            color = 'bg-warning text-dark';
        } 
        else if (difficultyScore >= 0.2) {
            level = 'Hard';
            color = 'bg-danger';
        }
        else {
            level = 'Very Hard';
            color = 'bg-dark';
        }

        const container = document.createElement('div');
        container.style.marginBottom = '1rem';

        const nameEl = document.createElement('div');
        nameEl.innerHTML = `<strong>${dataset.name}</strong>`;
        container.appendChild(nameEl);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress';
        progressWrapper.style.height = '20px';

        const progressBar = document.createElement('div');
        progressBar.className = `progress-bar ${color}`;
        progressBar.role = 'progressbar';
        progressBar.style.width = `${difficultyPercent}%`;
        progressBar.setAttribute('aria-valuenow', difficultyPercent);
        progressBar.setAttribute('aria-valuemin', 0);
        progressBar.setAttribute('aria-valuemax', 100);
        progressBar.innerText = `${level} (${difficultyDisplay})`;

        progressWrapper.appendChild(progressBar);
        container.appendChild(progressWrapper);

        difficultyElement.appendChild(container);
    });
}

function getConfidence(confidence) {
    if (confidence >= 0.9) return { label: "Very High", className: "bg-success" };
    if (confidence >= 0.75) return { label: "High", className: "bg-primary" };
    if (confidence >= 0.5) return { label: "Moderate", className: "bg-warning text-dark" };
    if (confidence >= 0.25) return { label: "Low", className: "bg-danger" };
    return { label: "Very Low", className: "bg-secondary" };
}

export function dispose() {
    calculatePcaButton.removeEventListener('click', updatePca);
    document.getElementById('aps-reset-graph-btn').removeEventListener('click', resetGraph);
    document.getElementById('aps-export-png-btn').removeEventListener('click', exportPngWithFeedback);
    document.querySelectorAll('.aps-selector').forEach(element => {
        element.removeEventListener('change', checkStaleData);
    });
}
