import { ChartHelper } from "../../chartHelper.js";
import { ApiService } from "../../apiService.js";
import { getQueryString, clearQueryString } from "../../main.js";

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

// NEW: Variable to hold the select all/deselect all button
var selectAllDatasetArea = null;
var selectAllDatasetButton = null;
var selectAllDatasetButtonText = null;

var chartHelper = null;
var selectedDatasets = [];

var shareButton = null;

export async function initialize(queryOptions) {
  firstAlgorithmElement = document.getElementById("formControlAlgorithm1");
  secondAlgorithmElement = document.getElementById("formControlAlgorithm2");
  performanceMetricElement = document.getElementById("formPerformanceMetric");
  kValueElement = document.getElementById("formKValue");
  datasetFilterHeaderElement = document.getElementById(
    "compare-algo-filter-header"
  );
  datasetFilterArea = document.getElementById("compare-algo-filter");
  canvasElement = document.getElementById("compare-algo-chart");
  solvedProblemsBodyElement = document.getElementById("compare-algo-solved");
  solvedByXBodyElement = document.getElementById("compare-algo-solved-by-x");
  solvedByYBodyElement = document.getElementById("compare-algo-solved-by-y");
  mediocresBodyElement = document.getElementById("compare-algo-mediocres");
  trueChallengesBodyElement = document.getElementById(
    "compare-algo-true-challenges"
  );

  tableAlgoXNameElements = document.querySelectorAll(".compare-algo-x-name");
  tableAlgoYNameElements = document.querySelectorAll(".compare-algo-y-name");
  tableSolvedByXHeaderElements = document.getElementById(
    "compare-algo-solved-by-x-header"
  );
  tableSolvedByYHeaderElements = document.getElementById(
    "compare-algo-solved-by-y-header"
  );

  document.getElementById('aps-redirect').addEventListener('click', apsRedirect);
  document.getElementById('compare-algo-export-btn').addEventListener('click', exportPngWithFeedback);
  // NEW: Add CSV export button event listener
  document.getElementById('compare-algo-export-csv-btn').addEventListener('click', exportCsvWithFeedback);
  document.querySelectorAll('.compareAlgorithms').forEach(element => {
    element.addEventListener('change', compareAlgorithms);
  });
  shareButton = document.getElementById("compare-algo-share-btn");
  shareButton.addEventListener("click", shareAlgorithmComparison);

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

  // Use query options if provided, otherwise default to the first two algorithms
  if (queryOptions.x) {
    // Check if the algorithm exists in the list
    const firstAlgorithm = algorithms.find(
      (algo) => algo.name.toLowerCase() === queryOptions.x.toLowerCase()
    );
    if (firstAlgorithm) {
      firstAlgorithmElement.value = firstAlgorithm.id;
    }
  } else {
    // If not found or empty, default to the first algorithm
    firstAlgorithmElement.value = algorithms[0].id;
  }
  if (queryOptions.y) {
    // Check if the algorithm exists in the list
    const secondAlgorithm = algorithms.find(
      (algo) => algo.name.toLowerCase() === queryOptions.y.toLowerCase()
    );
    if (secondAlgorithm) {
      secondAlgorithmElement.value = secondAlgorithm.id;
    }
  } else {
    // If not found or empty, default to the second algorithm, or the first if only one exists
    secondAlgorithmElement.value =
      algorithms.length > 1 ? algorithms[1].id : algorithms[0].id;
  }

  if (queryOptions.metric) {
    // Check if the metric exists in the options
    const metricOption = Array.from(performanceMetricElement.options).find(
      (option) => option.value === queryOptions.metric
    );
    if (metricOption) {
      performanceMetricElement.value = metricOption.value;
    } else {
      // If not found, default to the first metric
      performanceMetricElement.value =
        performanceMetricElement.options[0].value;
    }
  }

  if (queryOptions.k) {
    // If the user entered an integer, take the string and prepend "@"
    if (!isNaN(queryOptions.k)) {
      const kValue = `@${queryOptions.k}`;
      // Check if the kValue exists in the options
      const kOption = Array.from(kValueElement.options).find(
        (option) => option.textContent === kValue
      );
      if (kOption) {
        kValueElement.value = kOption.value;
      } else {
        // If not found, default to the first k value
        kValueElement.value = kValueElement.options[0].value;
      }
    } else {
      // If the user entered a string, just use it as is
      const kOption = Array.from(kValueElement.options).find(
        (option) => option.value === queryOptions.k
      );
      if (kOption) {
        kValueElement.value = kOption.value;
      } else {
        // If not found, default to the first k value
        kValueElement.value = kValueElement.options[0].value;
      }
    }
  }

  let queriedDatasets;
  if (!queryOptions.datasets) {
    // If no datasets are specified, select all datasets by default
    queriedDatasets = datasets.map((dataset) => dataset.id);
  } else {
    // If datasets are specified, parse them
    queriedDatasets = queryOptions.datasets.split(" ").map(Number);
  }

  createSelectAllDatasetButton();

  datasetFilterArea.innerHTML = "";
  datasetFilterArea.appendChild(selectAllDatasetArea);

  datasetFilterCheckboxes = [];
  selectedDatasets = [];
  datasets.forEach((dataset) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = dataset.id;
    checkbox.name = "datasetCheckbox";
    checkbox.value = dataset.name;
    checkbox.checked = queriedDatasets.includes(dataset.id);
    checkbox.onchange = onFilterDataset;

    const label = document.createElement("label");
    label.htmlFor = dataset.id;
    label.textContent = dataset.name;
    label.style.marginLeft = "0.25rem";

    const wrapper = document.createElement("div");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    datasetFilterArea.appendChild(wrapper);
    datasetFilterCheckboxes.push(checkbox);
    if (checkbox.checked) {
      selectedDatasets.push(dataset.id);
    }
  });

  updateFilterHeader();
  updateSelectAllDatasetButtonText();

  clearQueryString();

  await compareAlgorithms();
}

// NEW: Function to create the Select All/Deselect All button
function createSelectAllDatasetButton() {
    // Create button wrapper div that spans full width
    selectAllDatasetArea = document.createElement('div');
    selectAllDatasetArea.style.width = '100%';

    // Create the actual button
    selectAllDatasetButton = document.createElement('button');
    selectAllDatasetButton.type = 'button';
    selectAllDatasetButton.className = 'filter-control-btn';
    selectAllDatasetButton.addEventListener('click', toggleAllDatasets);

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-filter';
    icon.style.setProperty('color', 'white', 'important');
    icon.style.marginRight = '0.3rem';

    selectAllDatasetButtonText = document.createElement('span');
    selectAllDatasetButtonText.textContent = 'Deselect All'; // initial text

    selectAllDatasetButton.appendChild(icon);
    selectAllDatasetButton.appendChild(selectAllDatasetButtonText);
    selectAllDatasetArea.appendChild(selectAllDatasetButton);
}

// NEW: Function to toggle all datasets on/off
function toggleAllDatasets() {
    const checkedCount = datasetFilterCheckboxes.filter(checkbox => checkbox.checked).length;
    const shouldCheck = checkedCount !== datasetFilterCheckboxes.length;

    // Update all checkboxes
    datasetFilterCheckboxes.forEach(checkbox => {
        checkbox.checked = shouldCheck;
    });

    // Update selected datasets array
    selectedDatasets = shouldCheck ? datasets.map(dataset => dataset.id) : [];

    // Update the header and button text
    updateFilterHeader();
    updateSelectAllDatasetButtonText();

    // Trigger the algorithm comparison update
    compareAlgorithms();
}

// NEW: Function to update the Select All/Deselect All button text
function updateSelectAllDatasetButtonText() {
  const checkedCount = selectedDatasets.length;
  
  if (checkedCount === datasetFilterCheckboxes.length) {
      selectAllDatasetButtonText.textContent = 'Deselect All';
  } else {
      selectAllDatasetButtonText.textContent = 'Select All';
  }
}

// NEW: Function to update filter header text
function updateFilterHeader() {
    const checkedCount = selectedDatasets.length;
    
    if (checkedCount === datasetFilterCheckboxes.length) {
        datasetFilterHeaderElement.innerText = '(All selected)';
    } else if (checkedCount === 0) {
        datasetFilterHeaderElement.innerText = '(None selected)';
    } else if (checkedCount === 1) {
        // Find the single selected dataset and show its name
        const selectedCheckbox = datasetFilterCheckboxes.find(checkbox => checkbox.checked);
        const selectedDatasetId = Number(selectedCheckbox.id);
        const selectedDataset = datasets.find(dataset => dataset.id === selectedDatasetId);
        datasetFilterHeaderElement.innerText = `(${selectedDataset.name})`;
    } else {
        datasetFilterHeaderElement.innerText = `(${checkedCount} selected)`;
    }
}

function apsRedirect() {
  document.getElementById("aps-tab-btn").click();
}

async function compareAlgorithms() {
  const algoId1 = Number(firstAlgorithmElement.value);
  const algoId2 = Number(secondAlgorithmElement.value);
  const algoName1 =
    firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text;
  const algoName2 =
    secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text;
  const performanceMetric = performanceMetricElement.value;
  const performanceMetricName =
    performanceMetricElement.options[performanceMetricElement.selectedIndex]
      .text;
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

  drawChart(
    filteredResults,
    separatedResults,
    algoName1,
    algoName2,
    performanceMetricName,
    kValueName
  );
  fillTables(separatedResults, algoName1, algoName2);
}

async function onFilterDataset(e) {
  const datasetId = Number(e.target.id);
  if (e.target.checked) {
      selectedDatasets.push(datasetId);
  }
  else {
      const index = selectedDatasets.indexOf(datasetId);
      selectedDatasets.splice(index, 1);
  }

  updateFilterHeader();
  updateSelectAllDatasetButtonText();

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
    } else if (isPointInTriangle(result.x, result.y, 1, 1, 1, 0.5, 0.5, 1)) {
      solvedProblems.push(result);
    } else if (isPointInTriangle(result.x, result.y, 0.5, 0, 1, 0, 1, 0.5)) {
      solvedByAlgo1.push(result);
    } else if (isPointInTriangle(result.x, result.y, 0, 0.5, 0, 1, 0.5, 1)) {
      solvedByAlgo2.push(result);
    } else {
      mediocres.push(result);
    }
  });

  return {
    trueChallenges,
    solvedProblems,
    solvedByAlgo1,
    solvedByAlgo2,
    mediocres,
  };
}

function drawChart(
  filteredResults,
  separatedResults,
  algoName1,
  algoName2,
  performanceMetricName,
  kValueName
) {
  // Helper function to add dataset names to data points
  const addDatasetNames = (dataPoints) => {
    return dataPoints.map(point => {
      const dataset = datasets.find(d => d.id === point.id);
      return {
        ...point,
        datasetName: dataset ? dataset.name : `Dataset ${point.id}`
      };
    });
  };

  chartHelper.createChart(canvasElement, {
    datasets: [
      {
        label: "True Challenges",
        pointRadius: 5,
        pointBackgroundColor: "rgb(255, 30, 0)",
        pointBorderWidth: 0,
        data: addDatasetNames(separatedResults.trueChallenges),
      },
      {
        label: "Solved Problems",
        pointRadius: 5,
        pointBackgroundColor: "rgb(0, 150, 30)",
        pointBorderWidth: 0,
        data: addDatasetNames(separatedResults.solvedProblems),
      },
      {
        label: `Solved By ${algoName1}`,
        pointRadius: 5,
        pointBackgroundColor: "rgb(0, 70, 128)",
        pointBorderWidth: 0,
        data: addDatasetNames(separatedResults.solvedByAlgo1),
      },
      {
        label: `Solved By ${algoName2}`,
        pointRadius: 5,
        pointBackgroundColor: "rgb(180, 180, 0)",
        pointBorderWidth: 0,
        data: addDatasetNames(separatedResults.solvedByAlgo2),
      },
      {
        label: "Mediocres",
        pointRadius: 5,
        pointBackgroundColor: "rgb(150, 150, 150)",
        pointBorderWidth: 0,
        data: addDatasetNames(separatedResults.mediocres),
      },
    ],
    title: `Performance of ${algoName1} and ${algoName2} (${performanceMetricName}${kValueName})`,
    axisTitles: {
      x: {
        text: `Performance of ${algoName1}`,
        size: 14,
        bold: true,
      },
      y: {
        text: `Performance of ${algoName2}`,
        size: 14,
        bold: true,
      },
    },
    labels: {
      showX: true,
      showY: true,
      customLabels: filteredResults.reduce((data, result) => {
        const dataset = datasets.find(
          (dataset) => dataset.id == result.datasetId
        );
        data[dataset.id] = dataset.name;
        return data;
      }, {}),
    },
    legend: {
      show: true,
    },
    shapes: [
      {
        type: "line",
        style: "dashed",
        features: [false, 0, 0.5, 0.5, 1, 1, 0.5, 0.5, 0, 0, 0.5],
      },
      {
        type: "line",
        fillColor: "rgba(255, 0, 0, 0.4)",
        features: [true, 0, 0, 0, 0.5, 0.5, 0],
      },
      {
        type: "line",
        fillColor: "rgba(0, 255, 30, 0.4)",
        features: [true, 1, 1, 1, 0.5, 0.5, 1],
      },
      {
        type: "line",
        fillColor: "rgba(0, 130, 255, 0.3)",
        features: [true, 0.5, 0, 1, 0, 1, 0.5],
      },
      {
        type: "line",
        fillColor: "rgba(255, 255, 0, 0.4)",
        features: [true, 0, 0.5, 0.5, 1, 0, 1],
      },
      {
        type: "line",
        fillColor: "rgba(230, 230, 230, 0.4)",
        features: [true, 0, 0.5, 0.5, 1, 1, 0.5, 0.5, 0],
      },
    ],
  });
}

function exportPng() {
    const algoName1 = firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text.toLowerCase();
    const algoName2 = secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text.toLowerCase();
    const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text.toLowerCase();
    const kValueName = kValueElement.options[kValueElement.selectedIndex].text.toLowerCase();

  chartHelper.exportChartAsPng(
    `comparison-${algoName1}-${algoName2}-${performanceMetricName}${kValueName}`,
    canvasElement
  );
}

function shareAlgorithmComparison() {
  const algoName1 =
    firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text;
  const algoName2 =
    secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text;
  const performanceMetricName = performanceMetricElement.value;
  const kValueName = kValueElement.value;
  // Filter datasets based on the checkboxes
  const datasetFilter = selectedDatasets;

  const options = {
    tab: "compareAlgorithms",
    x: algoName1,
    y: algoName2,
    metric: performanceMetricName,
    k: kValueName,
    datasets: datasetFilter.join(" "),
  };
  const url = getQueryString(options);

  navigator.clipboard
    .writeText(url)
    .then(() => {
      const shareBtn = document.getElementById("compare-algo-share-btn");
      shareBtn.textContent = "Copied!";
      setTimeout(() => {
        shareBtn.innerHTML = '<i class="fa-solid fa-link"></i> Share';
      }, 2000);
    })
    .catch(() => {
      shareBtn.textContent = "Failed to copy";
      setTimeout(() => {
        shareBtn.innerHTML = '<i class="fa-solid fa-link"></i> Share';
      }, 2000);
    });
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
      // Show error feedback
      exportBtn.textContent = 'Export Failed';
      
      // Reset button after 3 seconds
      setTimeout(() => {
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
      }, 3000);
  }
}

// Enhanced CSV export function with user feedback
async function exportCsvWithFeedback() {
  const exportBtn = document.getElementById('compare-algo-export-csv-btn');
  const originalText = exportBtn.textContent;
  
  try {
      // Update button to show process is starting
      exportBtn.textContent = 'Exporting...';
      exportBtn.disabled = true;
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the filename dynamically 
      const algoName1 = firstAlgorithmElement.options[firstAlgorithmElement.selectedIndex].text.toLowerCase();
      const algoName2 = secondAlgorithmElement.options[secondAlgorithmElement.selectedIndex].text.toLowerCase();
      const performanceMetricName = performanceMetricElement.options[performanceMetricElement.selectedIndex].text.toLowerCase();
      const kValueName = kValueElement.options[kValueElement.selectedIndex].text.toLowerCase();
      
      // Call the CSV export function with the same naming convention
      chartHelper.exportChartAsCsv(`comparison-${algoName1}-${algoName2}-${performanceMetricName}${kValueName}`, canvasElement);
      
      // Show success feedback
      exportBtn.textContent = 'Exported!';
      
      // Reset button after 2 seconds
      setTimeout(() => {
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
      }, 2000);
      
  } catch (error) {
      console.error('CSV export error:', error);
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
  function fill(tableBodyElement, results) {
    if (results.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.colSpan = 3;
      td.className = 'modern-no-data';
      td.textContent = "(No datasets)";

      tr.appendChild(td);
      tableBodyElement.appendChild(tr);
    } else {
      results.forEach((result) => {
        const dataset = datasets.find((dataset) => dataset.id === result.id);

        const tr = document.createElement("tr");
        const tdDataset = document.createElement("td");
        const tdX = document.createElement("td");
        const tdY = document.createElement("td");

        tdDataset.textContent = dataset.name;

        tdX.className = 'value-cell';
        tdX.textContent = result.x.toFixed(5);

        tdY.className = 'value-cell';
        tdY.textContent = result.y.toFixed(5);

        tr.appendChild(tdDataset);
        tr.appendChild(tdX);
        tr.appendChild(tdY);
        tableBodyElement.appendChild(tr);
      });
    }
  }

  solvedProblemsBodyElement.innerHTML = "";
  solvedByXBodyElement.innerHTML = "";
  solvedByYBodyElement.innerHTML = "";
  mediocresBodyElement.innerHTML = "";
  trueChallengesBodyElement.innerHTML = "";

  tableSolvedByXHeaderElements.textContent = "Solved By " + algoName1;
  tableAlgoXNameElements.forEach((element) => {
    element.textContent = algoName1;
  });
  tableSolvedByYHeaderElements.textContent = "Solved By " + algoName2;
  tableAlgoYNameElements.forEach((element) => {
    element.textContent = algoName2;
  });

  fill(solvedProblemsBodyElement, separatedResults.solvedProblems);
  fill(solvedByXBodyElement, separatedResults.solvedByAlgo1);
  fill(solvedByYBodyElement, separatedResults.solvedByAlgo2);
  fill(mediocresBodyElement, separatedResults.mediocres);
  fill(trueChallengesBodyElement, separatedResults.trueChallenges);
}

export function dispose() {
  document.getElementById('aps-redirect').removeEventListener('click', apsRedirect);
  document.getElementById('compare-algo-export-btn').removeEventListener('click', exportPngWithFeedback);
  // NEW: Remove CSV export button listener
  document.getElementById('compare-algo-export-csv-btn').removeEventListener('click', exportCsvWithFeedback);
  document.querySelectorAll('.compareAlgorithms').forEach(element => {
      element.removeEventListener('change', compareAlgorithms);
  });
  selectAllDatasetButton.removeEventListener('click', toggleAllDatasets);
  shareButton.removeEventListener("click", shareAlgorithmComparison);
}