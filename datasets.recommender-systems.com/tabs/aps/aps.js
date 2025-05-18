import { ChartHelper } from "../../chartHelper.js";
import { ApiService } from "../../apiService.js";

var datasets = null;
var algorithms = null;

var performanceMetricElement = null;
var kValueElement = null;
var datasetFilterHeaderElement = null;
var datasetFilterArea = null;
var datasetFilterCheckboxes = [];
var canvasElement = null;
var similarityElement = null;
var difficultyElement = null;

var chartHelper = null;
var selectedDatasets = [];

export async function initialize() {
    performanceMetricElement = document.getElementById("formPerformanceMetricPca");
    kValueElement = document.getElementById("formKValuePca");
    datasetFilterHeaderElement = document.getElementById('aps-filter-header');
    datasetFilterArea = document.getElementById('aps-filter');
    canvasElement = document.getElementById('aps-chart');
    similarityElement = document.getElementById('similar-datasets');
    difficultyElement = document.getElementById('dataset-difficulty');

    document.getElementById('aps-reset-graph-btn').addEventListener('click', resetGraph);
    document.getElementById('aps-export-png-btn').addEventListener('click', exportPng);
    document.querySelectorAll('.updatePca').forEach(element => {
        element.addEventListener('change', updatePca);
    });

    chartHelper = new ChartHelper();

    datasets = await ApiService.getDatasets();
    algorithms = await ApiService.getAlgorithms();

    const algorithmNamesElement = document.getElementById('aps-algo');
    algorithmNamesElement.innerHTML = '';
    algorithms.forEach(algorithm => {
        const span = document.createElement('span');
        span.style = 'padding: 6px 12px; background-color: #f0f0f0; border-radius: 4px; font-size: 14px;'
        span.textContent = algorithm.name;
        algorithmNamesElement.appendChild(span);
    });

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

    await updatePca();
}

async function updatePca() {
    const performanceMetric = performanceMetricElement.value;
    const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text;
    const kValue = kValueElement.value;
    const kValueName = kValueElement.options[kValueElement.selectedIndex].text;

    const results = await ApiService.getPcaResults();
    const filteredResults = results.filter(result => selectedDatasets.includes(result.datasetId));
    const mappedResults = filteredResults.map(result => {
        return {
            id: result.datasetId,
            x: result[performanceMetric][kValue].x,
            y: result[performanceMetric][kValue].y,
            ellipseX: result[performanceMetric][kValue].varianceX,
            ellipseY: result[performanceMetric][kValue].varianceY,
        };
    });

    const minX = Math.min(...mappedResults.map(result => result.x));
    const maxX = Math.max(...mappedResults.map(result => result.x));
    const minY = Math.min(...mappedResults.map(result => result.y));
    const maxY = Math.max(...mappedResults.map(result => result.y));

    drawChart(mappedResults, performanceMetricName, kValueName, minX, maxX, minY, maxY);

    const similarDatasets = findSimilarDatasets(mappedResults);
    showSimilarDatasets(similarDatasets);

    showDatasetDifficulties(mappedResults, minX, maxX, minY, maxY);
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

    await updatePca();
}

function drawChart(mappedResults, performanceMetricName, kValueName, minX, maxX, minY, maxY) {
    const difficultyBarTopColor = 'rgb(0, 180, 40)';

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

        const r = Math.round(topColor[0] * ratio);
        const g = Math.round(topColor[1] * ratio);
        const b = Math.round(topColor[2] * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    }

    chartHelper.createChart(canvasElement, {
        datasets: [
            {
                label: 'Dataset Difficulty',
                pointBackgroundColor: difficultyBarTopColor
            },
            {
                label: 'Datasets',
                pointRadius: 5,
                pointBackgroundColor: mappedResults.map(result => getDatasetDifficultyColor(result, minX, maxX, minY, maxY)),
                pointBorderWidth: 0,
                backgroundColor: 'red',
                data: mappedResults
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
            topColor: difficultyBarTopColor
        },
        title: `Algorithm Performance Space (${performanceMetricName}${kValueName})`,
        labels: {
            showX: true,
            showY: true,
            customLabels: mappedResults.reduce((data, result) => {
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

function findSimilarDatasets(mappedResults) {
    const result = {};

    for (let i = 0; i < mappedResults.length; i++) {
        const a = mappedResults[i];
        const similar = [];

        for (let j = 0; j < mappedResults.length; j++) {
            if (i === j)
                continue;

            const b = mappedResults[j];

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

    return result;
}

function showSimilarDatasets(similarDatasets) {
    similarityElement.innerHTML = '';

    Object.entries(similarDatasets).forEach(([id, similarList]) => {
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

function showDatasetDifficulties(mappedResults, minX, maxX, minY, maxY) {
    difficultyElement.innerHTML = '';

    mappedResults.forEach(result => {
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
    document.getElementById('aps-reset-graph-btn').removeEventListener('click', resetGraph);
    document.getElementById('aps-export-png-btn').removeEventListener('click', exportPng);
    document.querySelectorAll('.updatePca').forEach(element => {
        element.removeEventListener('change', updatePca);
    });
}
