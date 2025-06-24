import { ChartHelper } from "../../chartHelper.js";
import { ApiService } from "../../apiService.js";
import { PCA } from "https://cdn.skypack.dev/ml-pca";
import {
  getQueryString,
  clearQueryString,
  copyToClipboard,
} from "../../main.js";

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
var updatePcaTextNoneSelected = null;
var updatePcaTextStale = null;
var updatePcaTextCalculating = null;
var canvasElement = null;
var similarityElement = null;
var dissimilarityElement = null; 
var difficultyElement = null;
var metadataButton = null;
var datasetListElement = null;
var clearHighlightButton = null;
var highlightedDatasetId = null;

// Modal info icon elements for Difficulties and Similarities
var difficultiesInfoIcon = null;
var difficultiesModal = null;
var similaritiesInfoIcon = null;
var similaritiesModal = null;
var dissimilaritiesInfoIcon = null; 
var dissimilaritiesModal = null; 
var selectAllAlgorithmArea = null;
var selectAllAlgorithmButton = null;
var selectAllAlgorithmButtonText = null;

var selectAllDatasetArea = null;
var selectAllDatasetButton = null;
var selectAllDatasetButtonText = null;

var chartHelper = null;
var selectedAlgorithms = [];
var selectedDatasets = [];

var lastMetricSelection = null;
var lastKValueSelection = null;
var lastAlgorithmFilter = [];
var lastDatasetFilter = [];
var currentPcaResults = null;
var currentMappedPcaResults = null;

/**
 * Calculate percentile using linear interpolation method
 * @param {Array} sortedData - Sorted array of values
 * @param {Number} percentile - Percentile to calculate (0-100)
 * @returns {Number} Percentile value
 */
function calculatePercentile(sortedData, percentile) {
    const n = sortedData.length;
    const index = (percentile / 100) * (n - 1);
    
    if (index % 1 === 0) {
        // Exact index
        return sortedData[index];
    } else {
        // Interpolate between two values
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }
}

/**
 * Calculate statistical difficulty thresholds using quantile-based distribution
 * @param {Array} difficultyScores - Array of difficulty scores for all datasets
 * @returns {Object} Thresholds and statistical info
 */
function calculateStatisticalDifficultyThresholds(difficultyScores) {
    // Sort scores in ascending order
    const sortedScores = [...difficultyScores].sort((a, b) => a - b);
    const n = sortedScores.length;
    
    // Calculate quintiles (20% quantiles)
    const quantiles = {
        q20: calculatePercentile(sortedScores, 20),
        q40: calculatePercentile(sortedScores, 40), 
        q60: calculatePercentile(sortedScores, 60),
        q80: calculatePercentile(sortedScores, 80)
    };
    
    // Calculate basic statistics
    const mean = sortedScores.reduce((sum, score) => sum + score, 0) / n;
    const variance = sortedScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return {
        thresholds: quantiles,
        statistics: {
            min: sortedScores[0],
            max: sortedScores[n - 1],
            mean: mean,
            standardDeviation: stdDev,
            median: calculatePercentile(sortedScores, 50),
            count: n
        },
        // Define difficulty levels based on quantiles
        levels: {
            veryHard: { min: sortedScores[0], max: quantiles.q20, label: "Very Hard", class: "bg-dark" },
            hard: { min: quantiles.q20, max: quantiles.q40, label: "Hard", class: "bg-danger" },
            medium: { min: quantiles.q40, max: quantiles.q60, label: "Medium", class: "bg-warning text-dark" },
            easy: { min: quantiles.q60, max: quantiles.q80, label: "Easy", class: "bg-primary" },
            veryEasy: { min: quantiles.q80, max: sortedScores[n - 1], label: "Very Easy", class: "bg-success" }
        }
    };
}

/**
 * Classify difficulty level using statistical thresholds
 * @param {Number} difficultyScore - The difficulty score to classify
 * @param {Object} thresholds - Threshold object from calculateStatisticalDifficultyThresholds
 * @returns {Object} Level information
 */
function classifyDifficultyLevel(difficultyScore, thresholds) {
    const { levels } = thresholds;
    
    if (difficultyScore <= levels.veryHard.max) {
        return levels.veryHard;
    } else if (difficultyScore <= levels.hard.max) {
        return levels.hard;
    } else if (difficultyScore <= levels.medium.max) {
        return levels.medium;
    } else if (difficultyScore <= levels.easy.max) {
        return levels.easy;
    } else {
        return levels.veryEasy;
    }
}

function createDifficultyLegend(statisticalModel) {
    let legendContainer = document.querySelector('.difficulty-legend-badges');
    
    if (!legendContainer) {
        const existingBadges = document.querySelector('div[style*="display: flex"][style*="gap: 12px"][style*="flex-wrap"]');
        if (existingBadges && existingBadges.querySelector('.badge')) {
            legendContainer = existingBadges;
            legendContainer.className = 'difficulty-legend-badges';
        } else {
            // Create new container if not found
            legendContainer = document.createElement('div');
            legendContainer.className = 'difficulty-legend-badges';
            legendContainer.style.display = 'flex';
            legendContainer.style.gap = '12px';
            legendContainer.style.flexWrap = 'wrap';
            legendContainer.style.marginTop = '0.5rem';
                        
            const difficultyHeader = document.querySelector('h5[style*="font-weight: bold"]');
            if (difficultyHeader && difficultyHeader.parentNode) {
                difficultyHeader.parentNode.insertBefore(legendContainer, difficultyHeader.nextSibling);
            }
        }
    }
    
    legendContainer.innerHTML = '';

        Object.values(statisticalModel.levels).forEach(level => {
        const badge = document.createElement('span');
        badge.className = `badge ${level.class}`;
        badge.textContent = `${level.label} (${level.min.toFixed(3)} - ${level.max.toFixed(3)})`;
        legendContainer.appendChild(badge);
    });
    
    let statsInfo = document.querySelector('.difficulty-stats-info');
    if (!statsInfo) {
        statsInfo = document.createElement('div');
        statsInfo.className = 'difficulty-stats-info';
        statsInfo.style.marginTop = '0.5rem';
        statsInfo.style.fontSize = '0.9em';
        statsInfo.style.color = '#666';
        legendContainer.parentNode.insertBefore(statsInfo, legendContainer.nextSibling);
    }
    
    statsInfo.innerHTML = `
        <small>
            <strong>Statistical Model:</strong> Quintile-based distribution | 
            <strong>Mean:</strong> ${statisticalModel.statistics.mean.toFixed(3)} | 
            <strong>Standard Deviation:</strong> ${statisticalModel.statistics.standardDeviation.toFixed(3)} | 
            <strong>Sample Size:</strong> ${statisticalModel.statistics.count}
        </small>
    `;
}

/**
 * Initializes the APS tab with the given query options.
 * @param {Object} queryOptions - The query options to initialize the tab with.
 */
export async function initialize(queryOptions) {
  // Get existing elements
  performanceMetricElement = document.getElementById(
    "formPerformanceMetricPca"
  );
  kValueElement = document.getElementById("formKValuePca");
  algorithmFilterHeaderElement = document.getElementById(
    "aps-algorithm-filter-header"
  );
  algorithmFilterArea = document.getElementById("aps-algorithm-filter");
  datasetFilterHeaderElement = document.getElementById(
    "aps-dataset-filter-header"
  );
  datasetFilterArea = document.getElementById("aps-dataset-filter");
  updatePcaButton = document.getElementById("aps-update-pca-btn");
  updatePcaTextNoneSelected = document.getElementById(
    "aps-update-pca-txt-none-selected"
  );
  updatePcaTextStale = document.getElementById("aps-update-pca-txt-stale");
  updatePcaTextCalculating = document.getElementById(
    "aps-update-pca-txt-calculating"
  );
  canvasElement = document.getElementById("aps-chart");
  similarityElement = document.getElementById("similar-datasets");
  dissimilarityElement = document.getElementById("dissimilar-datasets"); 
  difficultyElement = document.getElementById("dataset-difficulty");

  // Get modal elements for info icons
  difficultiesInfoIcon = document.getElementById("difficulties-info-icon");
  difficultiesModal = document.getElementById("difficulties-modal");
  similaritiesInfoIcon = document.getElementById("similarities-info-icon");
  similaritiesModal = document.getElementById("similarities-modal");
  dissimilaritiesInfoIcon = document.getElementById("dissimilarities-info-icon"); 
  dissimilaritiesModal = document.getElementById("dissimilarities-modal"); 
  metadataButton = document.getElementById("aps-metadata-btn");
  datasetListElement = document.getElementById("aps-dataset-list");
  clearHighlightButton = document.getElementById("aps-clear-highlight-btn");

  // Initialize modal event listeners for info icons
  initializeModalTooltips();

  // Add existing event listeners
  updatePcaButton.addEventListener("click", updatePca);
  document
    .getElementById("aps-reset-graph-btn")
    .addEventListener("click", resetGraph);
  document
    .getElementById("aps-export-png-btn")
    .addEventListener("click", exportPngWithFeedback);
  document
    .getElementById("aps-export-csv-btn")
    .addEventListener("click", exportCsvWithFeedback);
  document.querySelectorAll(".aps-selection").forEach((element) => {
    element.addEventListener("change", checkStaleData);
  });
  document.getElementById("aps-share-btn").addEventListener("click", shareAps);

  metadataButton.addEventListener("click", seeMetadata);

  // Add clear highlight button event listener
  clearHighlightButton.addEventListener("click", clearDatasetHighlight);

  chartHelper = new ChartHelper();

  // Load data from API
  datasets = await ApiService.getDatasets();
  algorithms = await ApiService.getAlgorithms();

  createSelectAllButtons();

  // Initialize algorithm filter
  algorithmFilterHeaderElement.innerText = "(All selected)";
  algorithmFilterArea.innerHTML = "";
  algorithmFilterArea.appendChild(selectAllAlgorithmArea);

  algorithmFilterCheckboxes = [];
  selectedAlgorithms = [];
  algorithms.forEach((algorithm) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `algorithm-${algorithm.id}`;
    checkbox.name = "algorithmCheckbox";
    checkbox.value = algorithm.name;
    checkbox.checked = true;
    checkbox.onchange = onFilterAlgorithm;

    const label = document.createElement("label");
    label.htmlFor = `algorithm-${algorithm.id}`;
    label.textContent = algorithm.name;
    label.style.marginLeft = "0.25rem";

    const wrapper = document.createElement("div");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    algorithmFilterArea.appendChild(wrapper);
    algorithmFilterCheckboxes.push(checkbox);
    selectedAlgorithms.push(algorithm.id);
  });

  // Initialize dataset filter
  datasetFilterHeaderElement.innerText = "(All selected)";
  datasetFilterArea.innerHTML = "";
  datasetFilterArea.appendChild(selectAllDatasetArea);

  datasetFilterCheckboxes = [];
  selectedDatasets = [];
  datasets.forEach((dataset) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `dataset-${dataset.id}`;
    checkbox.name = "datasetCheckbox";
    checkbox.value = dataset.name;
    checkbox.checked = true;
    checkbox.onchange = onFilterDataset;

    const label = document.createElement("label");
    label.htmlFor = `dataset-${dataset.id}`;
    label.textContent = dataset.name;
    label.style.marginLeft = "0.25rem";

    const wrapper = document.createElement("div");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    datasetFilterArea.appendChild(wrapper);
    datasetFilterCheckboxes.push(checkbox);
    selectedDatasets.push(dataset.id);
  });

  // Update filter headers and button texts
  updateFilterHeader(
    algorithmFilterCheckboxes,
    algorithmFilterHeaderElement,
    selectedAlgorithms,
    algorithms
  );
  updateSelectAllButtonText(
    algorithmFilterCheckboxes,
    selectAllAlgorithmButtonText,
    selectedAlgorithms
  );
  updateFilterHeader(
    datasetFilterCheckboxes,
    datasetFilterHeaderElement,
    selectedDatasets,
    datasets
  );
  updateSelectAllButtonText(
    datasetFilterCheckboxes,
    selectAllDatasetButtonText,
    selectedDatasets
  );

  // Set initial selections
  lastMetricSelection = "ndcg";
  lastKValueSelection = "one";
  lastAlgorithmFilter = [...selectedAlgorithms];
  lastDatasetFilter = [...selectedDatasets];

  // Apply query options if provided
  if (queryOptions) {
    if (queryOptions.metric) {
      const metricIndex = Array.from(
        performanceMetricElement.options
      ).findIndex((option) => option.value === queryOptions.metric);
      if (metricIndex !== -1) {
        performanceMetricElement.selectedIndex = metricIndex;
      } else {
        performanceMetricElement.value =
          performanceMetricElement.options[0].value;
      }
    }
    if (queryOptions.k) {
      const kIndex = Array.from(kValueElement.options).findIndex(
        (option) => option.value === queryOptions.k
      );
      if (kIndex !== -1) {
        kValueElement.selectedIndex = kIndex;
      } else {
        kValueElement.value = kValueElement.options[0].value;
      }
    }
    if (queryOptions.algorithms) {
      selectedAlgorithms = [];
      if (queryOptions.algorithms === "all") {
        algorithmFilterCheckboxes.forEach((checkbox) => {
          checkbox.checked = true;
          selectedAlgorithms.push(Number(checkbox.id.split("-")[1]));
        });
      } else {
        const queryAlgoIds = queryOptions.algorithms.split(" ").map(Number);
        algorithmFilterCheckboxes.forEach((checkbox) => {
          const checkboxId = Number(checkbox.id.split("-")[1]);
          if (queryAlgoIds.includes(checkboxId)) {
            checkbox.checked = true;
            selectedAlgorithms.push(checkboxId);
          } else {
            checkbox.checked = false;
          }
        });
      }
      updateFilterHeader(
        algorithmFilterCheckboxes,
        algorithmFilterHeaderElement,
        selectedAlgorithms,
        algorithms
      );
      updateSelectAllButtonText(
        algorithmFilterCheckboxes,
        selectAllAlgorithmButtonText,
        selectedAlgorithms
      );
    }
    if (queryOptions.datasets) {
      selectedDatasets = [];
      if (queryOptions.datasets === "all") {
        datasetFilterCheckboxes.forEach((checkbox) => {
          checkbox.checked = true;
          selectedDatasets.push(Number(checkbox.id.split("-")[1]));
        });
      } else {
        const queryDatasetIds = queryOptions.datasets.split(" ").map(Number);
        datasetFilterCheckboxes.forEach((checkbox) => {
          const checkboxId = Number(checkbox.id.split("-")[1]);
          if (queryDatasetIds.includes(checkboxId)) {
            checkbox.checked = true;
            selectedDatasets.push(checkboxId);
          } else {
            checkbox.checked = false;
          }
        });
      }
      updateFilterHeader(
        datasetFilterCheckboxes,
        datasetFilterHeaderElement,
        selectedDatasets,
        datasets
      );
      updateSelectAllButtonText(
        datasetFilterCheckboxes,
        selectAllDatasetButtonText,
        selectedDatasets
      );
    }
  }

  // Initial data check and PCA update
  checkStaleData();

  clearQueryString();

  await updatePca();
}

/**
 * Initialize modal tooltips for Difficulties, Similarities, and Dissimilarities sections
 * This creates click-to-open modal functionality for info icons
 */
function initializeModalTooltips() {
  // Difficulties info icon modal
  if (difficultiesInfoIcon && difficultiesModal) {
    // Open modal on click
    difficultiesInfoIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(difficultiesModal);
    });

    // Close modal when clicking close button
    const closeBtn = difficultiesModal.querySelector(".info-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(difficultiesModal);
      });
    }

    // Close modal when clicking overlay
    difficultiesModal.addEventListener("click", (e) => {
      if (e.target === difficultiesModal) {
        closeModal(difficultiesModal);
      }
    });
  }

  // Similarities info icon modal
  if (similaritiesInfoIcon && similaritiesModal) {
    // Open modal on click
    similaritiesInfoIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(similaritiesModal);
    });

    // Close modal when clicking close button
    const closeBtn = similaritiesModal.querySelector(".info-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(similaritiesModal);
      });
    }

    // Close modal when clicking overlay
    similaritiesModal.addEventListener("click", (e) => {
      if (e.target === similaritiesModal) {
        closeModal(similaritiesModal);
      }
    });
  }

  // Dissimilarities info icon modal
  if (dissimilaritiesInfoIcon && dissimilaritiesModal) {
    // Open modal on click
    dissimilaritiesInfoIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(dissimilaritiesModal);
    });

    // Close modal when clicking close button
    const closeBtn = dissimilaritiesModal.querySelector(".info-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(dissimilaritiesModal);
      });
    }

    // Close modal when clicking overlay
    dissimilaritiesModal.addEventListener("click", (e) => {
      if (e.target === dissimilaritiesModal) {
        closeModal(dissimilaritiesModal);
      }
    });
  }

  // Close modals when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
}

/**
 * Open modal with smooth animation
 */
function openModal(modal) {
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
}

/**
 * Close modal with smooth animation
 */
function closeModal(modal) {
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto"; // Restore scrolling
  }
}

/**
 * Close all open modals
 */
function closeAllModals() {
  const allModals = document.querySelectorAll(".info-modal-overlay");
  allModals.forEach((modal) => {
    closeModal(modal);
  });
}

/**
 * Check if the current data is stale compared to last selections
 * Shows appropriate UI messages based on selection state
 */
function checkStaleData() {
  function isSelectionEqual(lastSelection, currentSelection) {
    if (lastSelection.length !== currentSelection.length) return false;

    const sortedLastSelection = [...lastSelection].sort((a, b) => a - b);
    const sortedCurrentSelection = [...currentSelection].sort((a, b) => a - b);

    return sortedLastSelection.every(
      (val, index) => val === sortedCurrentSelection[index]
    );
  }

  if (
    lastMetricSelection !== performanceMetricElement.value ||
    lastKValueSelection !== kValueElement.value ||
    lastAlgorithmFilter.length !== selectedAlgorithms.length ||
    lastDatasetFilter.length !== selectedDatasets.length ||
    !isSelectionEqual(lastAlgorithmFilter, selectedAlgorithms) ||
    !isSelectionEqual(lastDatasetFilter, selectedDatasets)
  ) {
    if (selectedAlgorithms.length > 1 && selectedDatasets.length > 1) {
      updatePcaButton.disabled = false;
      updatePcaTextStale.style.display = "block";
      updatePcaTextNoneSelected.style.display = "none";
    } else {
      updatePcaButton.disabled = true;
      updatePcaTextStale.style.display = "none";
      updatePcaTextNoneSelected.style.display = "block";
    }
  } else {
    updatePcaButton.disabled = true;
    updatePcaTextStale.style.display = "none";
    updatePcaTextNoneSelected.style.display = "none";
  }
}

/**
 * Create select all/deselect all buttons for filters
 */
function createSelectAllButtons() {
  // Algorithm filter
  selectAllAlgorithmArea = document.createElement("div");
  selectAllAlgorithmArea.style.width = "100%";

  selectAllAlgorithmButton = document.createElement("button");
  selectAllAlgorithmButton.type = "button";
  selectAllAlgorithmButton.className = "filter-control-btn";
  selectAllAlgorithmButton.addEventListener("click", toggleAllAlgorithms);

  let icon = document.createElement("i");
  icon.className = "fa-solid fa-filter";
  icon.style.setProperty("color", "white", "important");
  icon.style.marginRight = "0.3rem";

  selectAllAlgorithmButtonText = document.createElement("span");
  selectAllAlgorithmButtonText.textContent = "Deselect All";

  selectAllAlgorithmButton.appendChild(icon);
  selectAllAlgorithmButton.appendChild(selectAllAlgorithmButtonText);
  selectAllAlgorithmArea.appendChild(selectAllAlgorithmButton);

  // Dataset filter
  selectAllDatasetArea = document.createElement("div");
  selectAllDatasetArea.style.width = "100%";

  selectAllDatasetButton = document.createElement("button");
  selectAllDatasetButton.type = "button";
  selectAllDatasetButton.className = "filter-control-btn";
  selectAllDatasetButton.addEventListener("click", toggleAllDatasets);

  icon = document.createElement("i");
  icon.className = "fa-solid fa-filter";
  icon.style.setProperty("color", "white", "important");
  icon.style.marginRight = "0.3rem";

  selectAllDatasetButtonText = document.createElement("span");
  selectAllDatasetButtonText.textContent = "Deselect All";

  selectAllDatasetButton.appendChild(icon);
  selectAllDatasetButton.appendChild(selectAllDatasetButtonText);
  selectAllDatasetArea.appendChild(selectAllDatasetButton);
}

/**
 * Toggle all algorithm selections
 */
function toggleAllAlgorithms() {
  const checkedCount = selectedAlgorithms.length;
  const shouldCheck = checkedCount !== algorithmFilterCheckboxes.length;

  algorithmFilterCheckboxes.forEach((checkbox) => {
    checkbox.checked = shouldCheck;
  });

  selectedAlgorithms = shouldCheck
    ? algorithms.map((algorithm) => algorithm.id)
    : [];

  updateFilterHeader(
    algorithmFilterCheckboxes,
    algorithmFilterHeaderElement,
    selectedAlgorithms,
    algorithms
  );
  updateSelectAllButtonText(
    algorithmFilterCheckboxes,
    selectAllAlgorithmButtonText,
    selectedAlgorithms
  );
  checkStaleData();
}

/**
 * Toggle all dataset selections
 */
function toggleAllDatasets() {
  const checkedCount = selectedDatasets.length;
  const shouldCheck = checkedCount !== datasetFilterCheckboxes.length;

  datasetFilterCheckboxes.forEach((checkbox) => {
    checkbox.checked = shouldCheck;
  });

  selectedDatasets = shouldCheck ? datasets.map((dataset) => dataset.id) : [];

  updateFilterHeader(
    datasetFilterCheckboxes,
    datasetFilterHeaderElement,
    selectedDatasets,
    datasets
  );
  updateSelectAllButtonText(
    datasetFilterCheckboxes,
    selectAllDatasetButtonText,
    selectedDatasets
  );
  checkStaleData();
}

/**
 * Update filter header text based on selections
 */
function updateFilterHeader(checkboxes, header, selection, list) {
  const checkedCount = selection.length;

  if (checkedCount === checkboxes.length) {
    header.innerText = "(All selected)";
  } else if (checkedCount === 0) {
    header.innerText = "(None selected)";
  } else if (checkedCount === 1) {
    const selectedCheckbox = checkboxes.find((checkbox) => checkbox.checked);
    const selectedId = Number(selectedCheckbox.id.split("-")[1]);
    const selected = list.find((x) => x.id === selectedId);
    header.innerText = `(${selected.name})`;
  } else {
    header.innerText = `(${checkedCount} selected)`;
  }
}

/**
 * Update select all button text based on current selections
 */
function updateSelectAllButtonText(checkboxes, text, selection) {
  const checkedCount = selection.length;
  if (checkedCount === checkboxes.length) {
    text.textContent = "Deselect All";
  } else {
    text.textContent = "Select All";
  }
}

/**
 * Create and populate the interactive dataset list
 */
function createDatasetList(
  mappedPcaResults,
  filteredResults,
  pcaMinX,
  pcaMaxX,
  pcaMinY,
  pcaMaxY
) {
  datasetListElement.innerHTML = "";

  // Sort datasets alphabetically by name for clean organization
  const sortedResults = filteredResults.slice().sort((a, b) => {
    const aDataset = datasets.find((d) => d.id === a.id);
    const bDataset = datasets.find((d) => d.id === b.id);
    return aDataset.name.localeCompare(bDataset.name);
  });

  sortedResults.forEach((result) => {
    const dataset = datasets.find((d) => d.id === result.id);

    // Create dataset item
    const item = document.createElement("div");
    item.className = "aps-dataset-item";
    item.dataset.datasetId = dataset.id;

    item.innerHTML = `
            <span class="aps-dataset-name">${dataset.name}</span>
        `;

    // Add click event for highlighting
    item.addEventListener("click", () => {
      highlightDataset(dataset.id);
    });

    datasetListElement.appendChild(item);
  });
}

/**
 * Highlight a specific dataset on the chart and in the list
 */
function highlightDataset(datasetId) {

  // Clear previous highlight
  clearDatasetHighlight();

  // Set new highlight
  highlightedDatasetId = datasetId;

  // Update chart highlight
  if (chartHelper && currentPcaResults) {
    chartHelper.highlightPoint(canvasElement, datasetId);
  }

  // Update list highlight
  const listItem = datasetListElement.querySelector(
    `[data-dataset-id="${datasetId}"]`
  );
  if (listItem) {
    listItem.classList.add("highlighted");
  }

  // Show clear highlight button
  clearHighlightButton.style.display = "inline-block";
}

/**
 * Clear dataset highlighting
 */
function clearDatasetHighlight() {
  if (highlightedDatasetId) {
    // Clear chart highlight
    if (chartHelper) {
      chartHelper.clearHighlight(canvasElement);
    }

    // Clear list highlight
    const listItem = datasetListElement.querySelector(
      `[data-dataset-id="${highlightedDatasetId}"]`
    );
    if (listItem) {
      listItem.classList.remove("highlighted");
    }

    highlightedDatasetId = null;
  }

  // Hide clear highlight button
  clearHighlightButton.style.display = "none";
}

/**
 * Main function to update PCA analysis and display results
 */
async function updatePca() {
  // Show loading state
  updatePcaButton.disabled = true;
  updatePcaTextStale.style.display = "none";
  updatePcaTextCalculating.style.display = "block";

  // Clear any existing highlights
  clearDatasetHighlight();

  // Get selected values from form
  const performanceMetric = performanceMetricElement.value;
  const performanceMetricName =
    performanceMetricElement.options[performanceMetricElement.selectedIndex]
      .text;
  const kValue = kValueElement.value;
  const kValueName = kValueElement.options[kValueElement.selectedIndex].text;

  // Get performance results from the DB
  let filteredResults;
  if (
    selectedAlgorithms.length === algorithms.length &&
    selectedDatasets.length === datasets.length
  ) {
    // No filter is applied. Get the PCA results directly from the backend
    const results = await ApiService.getPcaResults();
    filteredResults = results.map((result) => {
      return {
        id: result.datasetId,
        x: result[performanceMetric][kValue].x,
        y: result[performanceMetric][kValue].y,
        ellipseX: result[performanceMetric][kValue].varianceX,
        ellipseY: result[performanceMetric][kValue].varianceY,
      };
    });
  } else {
    // Get the performance results from the backend calculate the PCA locally
    const performanceResults = await ApiService.getPerformanceResults(
      selectedDatasets,
      selectedAlgorithms
    );

    const X = selectedDatasets.map((datasetId) => {
      return selectedAlgorithms.map((algorithmId) => {
        const value =
          performanceResults[datasetId]?.[algorithmId]?.[performanceMetric]?.[
            kValue
          ];
        return value != null ? value : NaN;
      });
    });

    const nRows = X.length;
    const nCols = X[0].length;
    const colMeans = [];
    for (let c = 0; c < nCols; c++) {
      let sum = 0,
        count = 0;
      for (let r = 0; r < nRows; r++) {
        if (!Number.isNaN(X[r][c])) {
          sum += X[r][c];
          count++;
        }
      }
      colMeans[c] = count > 0 ? sum / count : 0;
    }

    const X_imputed = X.map((row) =>
      row.map((v, c) => (Number.isNaN(v) ? colMeans[c] : v))
    );
    const pca = new PCA(X_imputed, { center: true, scale: false });
    const X_pca = pca.predict(X_imputed).data.map((arr) => Array.from(arr));

    const results = selectedDatasets.map((datasetId, i) => {
      const points = selectedAlgorithms.map((algorithmId, algIdx) => {
        const rowVector = new Array(nCols).fill(NaN);
        const val =
          performanceResults[datasetId]?.[algorithmId]?.[performanceMetric]?.[
            kValue
          ];
        rowVector[algIdx] = val != null ? val : NaN;
        const imputedRow = rowVector.map((v, idx) =>
          Number.isNaN(v) ? pca.means[idx] : v
        );
        const prediction = pca.predict([imputedRow]);
        return prediction.data[0];
      });

      let varianceX = 0,
        varianceY = 0;
      if (points.length > 1) {
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
        const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
        varianceX = Math.sqrt(
          xs.reduce((acc, v) => acc + (v - meanX) ** 2, 0) / xs.length
        );
        varianceY = Math.sqrt(
          ys.reduce((acc, v) => acc + (v - meanY) ** 2, 0) / ys.length
        );
      }

      return {
        datasetId: datasetId,
        x: X_pca[i][0],
        y: -X_pca[i][1], // This PCA code's output is mirrored horizontally compared to the Python script! That's why it's minus
        varianceX,
        varianceY,
      };
    });

    filteredResults = results.map((result) => {
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
  const mappedPcaResults = pcaResults.map((result) => {
    return {
      id: result.datasetId,
      x: result[performanceMetric][kValue].x,
      y: result[performanceMetric][kValue].y,
    };
  });

  const pcaMinX = Math.min(...mappedPcaResults.map((result) => result.x));
  const pcaMaxX = Math.max(...mappedPcaResults.map((result) => result.x));
  const pcaMinY = Math.min(...mappedPcaResults.map((result) => result.y));
  const pcaMaxY = Math.max(...mappedPcaResults.map((result) => result.y));

  // Store current results for highlighting
  currentPcaResults = filteredResults;
  currentMappedPcaResults = mappedPcaResults;

  // Create interactive dataset list
  createDatasetList(
    mappedPcaResults,
    filteredResults,
    pcaMinX,
    pcaMaxX,
    pcaMinY,
    pcaMaxY
  );

  // Show difficulties, similarities, and dissimilarities sections
  showDatasetDifficulties(
    mappedPcaResults,
    filteredResults,
    pcaMinX,
    pcaMaxX,
    pcaMinY,
    pcaMaxY
  );
  showSimilarDatasets(filteredResults);
  showDissimilarDatasets(filteredResults);

  // Draw the chart
  const minX = Math.min(...filteredResults.map((result) => result.x));
  const maxX = Math.max(...filteredResults.map((result) => result.x));
  const minY = Math.min(...filteredResults.map((result) => result.y));
  const maxY = Math.max(...filteredResults.map((result) => result.y));

  drawChart(
    filteredResults,
    mappedPcaResults,
    performanceMetricName,
    kValueName,
    minX,
    maxX,
    minY,
    maxY,
    pcaMinX,
    pcaMaxX,
    pcaMinY,
    pcaMaxY
  );

  // Save the last selections for stale data checking
  lastMetricSelection = performanceMetric;
  lastKValueSelection = kValue;
  lastAlgorithmFilter = [...selectedAlgorithms];
  lastDatasetFilter = [...selectedDatasets];
  checkStaleData();

  // Hide loading text
  updatePcaTextCalculating.style.display = "none";
}

/**
 * Handle algorithm filter checkbox changes
 */
function onFilterAlgorithm(e) {
  const algorithmId = Number(e.target.id.split("-")[1]);
  if (e.target.checked) {
    selectedAlgorithms.push(algorithmId);
  } else {
    const index = selectedAlgorithms.indexOf(algorithmId);
    selectedAlgorithms.splice(index, 1);
  }

  updateFilterHeader(
    algorithmFilterCheckboxes,
    algorithmFilterHeaderElement,
    selectedAlgorithms,
    algorithms
  );
  updateSelectAllButtonText(
    algorithmFilterCheckboxes,
    selectAllAlgorithmButtonText,
    selectedAlgorithms
  );
  checkStaleData();
}

/**
 * Handle dataset filter checkbox changes
 */
function onFilterDataset(e) {
  const datasetId = Number(e.target.id.split("-")[1]);
  if (e.target.checked) {
    selectedDatasets.push(datasetId);
  } else {
    const index = selectedDatasets.indexOf(datasetId);
    selectedDatasets.splice(index, 1);
  }

  updateFilterHeader(
    datasetFilterCheckboxes,
    datasetFilterHeaderElement,
    selectedDatasets,
    datasets
  );
  updateSelectAllButtonText(
    datasetFilterCheckboxes,
    selectAllDatasetButtonText,
    selectedDatasets
  );
  checkStaleData();
}

/**
 * Draw the main PCA chart
 */
function drawChart(
  filteredResults,
  mappedPcaResults,
  performanceMetricName,
  kValueName,
  minX,
  maxX,
  minY,
  maxY,
  pcaMinX,
  pcaMaxX,
  pcaMinY,
  pcaMaxY
) {
  const difficultyBarTopColor = "rgb(253, 196, 125)";

  function getDatasetDifficultyColor(point, minX, maxX, minY, maxY) {
    let topColor = [];
    let topColorStart = difficultyBarTopColor.indexOf("rgb");
    let topColorOpen = difficultyBarTopColor.indexOf("(", topColorStart);
    let topColorClose = difficultyBarTopColor.indexOf(")", topColorOpen);
    let topColorValues = difficultyBarTopColor
      .slice(topColorOpen + 1, topColorClose)
      .split(",")
      .map((v) => v.trim());
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
      {
        label: "Datasets",
        pointRadius: 5,
        pointBackgroundColor: filteredResults.map((result) =>
          getDatasetDifficultyColor(
            mappedPcaResults.find((x) => x.id === result.id),
            pcaMinX,
            pcaMaxX,
            pcaMinY,
            pcaMaxY
          )
        ),
        pointBorderWidth: 0,
        backgroundColor: "red",
        data: filteredResults.map((result) => {
          const dataset = datasets.find((d) => d.id === result.id);
          return {
            x: result.x,
            y: result.y,
            id: result.id,
            datasetName: dataset ? dataset.name : `Dataset ${result.id}`,
            ellipseX: result.ellipseX,
            ellipseY: result.ellipseY,
          };
        }),
      },
      {
        label: "Variances",
        pointBackgroundColor: "rgb(255, 0, 0)",
      },
    ],
    drawEllipseAroundDots: {
      show: true,
      color: "rgba(255, 0, 0, 0.5)",
      legendTitle: "Variances",
    },
    title: `Algorithm Performance Space (${performanceMetricName}${kValueName})`,
    axisTitles: {
      x: {
        text: "Component 1",
        size: 14,
        bold: true,
      },
      y: {
        text: "Component 2",
        size: 14,
        bold: true,
      },
    },
    labels: {
      showX: true,
      showY: true,
      customLabels: filteredResults.reduce((data, result) => {
        const dataset = datasets.find((dataset) => dataset.id == result.id);
        data[dataset.id] = dataset.name;
        return data;
      }, {}),
    },
    legend: {
      show: true,
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
        stepSize: 0.1,
      },
    },
    // Add click handler for chart points
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const datasetId = filteredResults[dataIndex].id;
        highlightDataset(datasetId);
      } else {
        // Click on empty area clears highlight
        clearDatasetHighlight();
      }
    },
    // Add interaction configuration for better click detection
    interaction: {
      intersect: false,
      mode: "point",
    },
  });
}

/**
 * Reset chart zoom/pan to default view
 */
function resetGraph() {
  chartHelper.resetChart(canvasElement);
}

/**
 * Enhanced export function with user feedback to show the process is working
 */
async function exportPngWithFeedback() {
  const exportBtn = document.getElementById("aps-export-png-btn");
  const icon = exportBtn.querySelector("i");
  const originalText = exportBtn.lastChild.textContent;

  try {
    // Update button to show process is starting
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Exporting..."));
    exportBtn.disabled = true;

    // Small delay to ensure UI updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Call the export function
    chartHelper.exportChartAsPng("aps", canvasElement);

    // Show success feedback
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Exported!"));

    // Reset button after 2 seconds
    setTimeout(() => {
      exportBtn.innerHTML =
        '<i class="fa-solid fa-download" style="color: white !important; margin-right: 0.3rem;"></i>Export as PNG';
      exportBtn.disabled = false;
    }, 2000);
  } catch (error) {
    // Show error feedback
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Export Failed"));

    // Reset button after 3 seconds
    setTimeout(() => {
      exportBtn.innerHTML =
        '<i class="fa-solid fa-download" style="color: white !important; margin-right: 0.3rem;"></i>Export as PNG';
      exportBtn.disabled = false;
    }, 3000);
  }
}

// Enhanced CSV export function with user feedback
async function exportCsvWithFeedback() {
  const exportBtn = document.getElementById("aps-export-csv-btn");
  const icon = exportBtn.querySelector("i");
  const originalText = exportBtn.lastChild.textContent;

  try {
    // Update button to show process is starting
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Exporting..."));
    exportBtn.disabled = true;

    // Small delay to ensure UI updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Call the CSV export function
    chartHelper.exportChartAsCsv("aps", canvasElement);

    // Show success feedback
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Exported!"));

    // Reset button after 2 seconds
    setTimeout(() => {
      exportBtn.innerHTML =
        '<i class="fa-solid fa-file-csv" style="color: white !important; margin-right: 0.3rem;"></i>Export as CSV';
      exportBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("CSV export error:", error);
    // Show error feedback
    exportBtn.innerHTML = "";
    exportBtn.appendChild(icon.cloneNode(true));
    exportBtn.appendChild(document.createTextNode("Export Failed"));

    // Reset button after 3 seconds
    setTimeout(() => {
      exportBtn.innerHTML =
        '<i class="fa-solid fa-file-csv" style="color: white !important; margin-right: 0.3rem;"></i>Export as CSV';
      exportBtn.disabled = false;
    }, 3000);
  }
}

function shareAps() {
  const performanceMetricName = lastMetricSelection;
  const kValueName = lastKValueSelection;
  const algorithmFilter =
    lastAlgorithmFilter.length === algorithms.length
      ? "all"
      : lastAlgorithmFilter.join(" ");
  const datasetFilter =
    lastDatasetFilter.length === datasets.length
      ? "all"
      : lastDatasetFilter.join(" ");

  const options = {
    tab: "aps",
    metric: performanceMetricName,
    k: kValueName,
    algorithms: algorithmFilter,
    datasets: datasetFilter,
  };
  const queryStringUrl = getQueryString(options);
  copyToClipboard(queryStringUrl, "aps-share-btn");
}

function seeMetadata() {
  const options = {
    tab: "compareDatasets",
    datasets: lastDatasetFilter.join(" "),
  };

  const url = getQueryString(options);
  window.open(url, "_blank");
}

/**
 * Uses dissimilarity = 1 - similarity 
 */
function showDissimilarDatasets(filteredResults) {
  // Find dissimilar datasets using 1 - similarity
  const result = {};

  for (let i = 0; i < filteredResults.length; i++) {
    const a = filteredResults[i];
    const dissimilar = [];

    for (let j = 0; j < filteredResults.length; j++) {
      if (i === j) continue;

      const b = filteredResults[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;

      const varX = (a.ellipseX ?? 0) ** 2 + (b.ellipseX ?? 0) ** 2;
      const varY = (a.ellipseY ?? 0) ** 2 + (b.ellipseY ?? 0) ** 2;

      if (varX === 0 || varY === 0) continue;

      const distance = Math.sqrt((dx * dx) / varX + (dy * dy) / varY);
      const similarity = Math.exp(-distance);
      const dissimilarity = 1 - similarity; 
      
      // Show datasets with high dissimilarity 
      if (dissimilarity > 0.95) { // Only show very high dissimilarity(threshold)
        dissimilar.push({
          id: b.id,
          similarity: parseFloat(similarity.toFixed(3)),
          dissimilarity: parseFloat(dissimilarity.toFixed(3)),
        });
      }
    }

    result[a.id] = dissimilar;
  }

  // Show dissimilarities in accordion format
  dissimilarityElement.innerHTML = "";
  Object.entries(result).forEach(([id, dissimilarList]) => {
    const collapseId = `collapse-dissimilar-${id}`;
    const headingId = `heading-dissimilar-${id}`;

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
    button.textContent = datasets.find((dataset) => dataset.id == id).name;

    h2.appendChild(button);

    const collapse = document.createElement("div");
    collapse.id = collapseId;
    collapse.className = "accordion-collapse collapse";
    collapse.setAttribute("aria-labelledby", headingId);
    collapse.setAttribute("data-bs-parent", "#accordionAPSDissimilar");

    const body = document.createElement("div");
    body.className = "accordion-body";
    body.style.display = "flex";
    body.style.flexWrap = "wrap";
    body.style.gap = "1rem";

    if (dissimilarList.length === 0) {
      const noDissimilar = document.createElement("span");
      noDissimilar.textContent = "(No highly dissimilar datasets)";
      body.appendChild(noDissimilar);
    } else {
      dissimilarList
        .sort((a, b) => b.dissimilarity - a.dissimilarity) // Sort by highest dissimilarity first
        .forEach(({ id: dissimId, similarity, dissimilarity }) => {
          const badge = document.createElement("span");
          const { label, className } = getDissimilarityConfidence(dissimilarity);
          badge.className = `badge ${className}`;
          const name = datasets.find((dataset) => dataset.id == dissimId).name;
          badge.textContent = `${name} (${label}: ${dissimilarity.toFixed(3)})`;
          body.appendChild(badge);
        });
    }

    collapse.appendChild(body);
    item.appendChild(h2);
    item.appendChild(collapse);
    wrapper.appendChild(item);
    dissimilarityElement.appendChild(wrapper);
  });
}

/**
 * Ranges for dissimilarity = 1 - similarity
 */
function getDissimilarityConfidence(dissimilarity) {
  if (dissimilarity >= 0.99) return { label: "Very High", className: "bg-success" };
  if (dissimilarity >= 0.95) return { label: "High", className: "bg-primary" };
  if (dissimilarity >= 0.90) return { label: "Moderate", className: "bg-warning text-dark" };
  if (dissimilarity >= 0.75) return { label: "Low", className: "bg-danger" };
  return { label: "Very Low", className: "bg-secondary" };
}
/**
 * Display similar datasets based on variance-normalized distance
 */
function showSimilarDatasets(filteredResults) {
  // Find similar datasets
  const result = {};

  for (let i = 0; i < filteredResults.length; i++) {
    const a = filteredResults[i];
    const similar = [];

    for (let j = 0; j < filteredResults.length; j++) {
      if (i === j) continue;

      const b = filteredResults[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;

      const varX = (a.ellipseX ?? 0) ** 2 + (b.ellipseX ?? 0) ** 2;
      const varY = (a.ellipseY ?? 0) ** 2 + (b.ellipseY ?? 0) ** 2;

      if (varX === 0 || varY === 0) continue;

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

  // Show similarities in accordion format
  similarityElement.innerHTML = "";
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
    button.textContent = datasets.find((dataset) => dataset.id == id).name;

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
      similarList
        .sort((a, b) => b.confidence - a.confidence)
        .forEach(({ id: simId, confidence }) => {
          const badge = document.createElement("span");
          const { label, className } = getConfidence(confidence);
          badge.className = `badge ${className}`;
          const name = datasets.find((dataset) => dataset.id == simId).name;
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

/**
 * Display dataset difficulties using statistical model
 */
function showDatasetDifficulties(mappedPcaResults, filteredResults, minX, maxX, minY, maxY) {
    difficultyElement.innerHTML = '';

    // Calculate difficulty scores for all datasets (both filtered and unfiltered)
    const allDifficultyScores = mappedPcaResults.map(result => {
        const normX = (result.x - minX) / (maxX - minX);
        const normY = (result.y - minY) / (maxY - minY);
        return (normX + normY) / 2;
    });

    // Calculate statistical thresholds based on ALL datasets
    const statisticalModel = calculateStatisticalDifficultyThresholds(allDifficultyScores);
    createDifficultyLegend(statisticalModel);

    // Display difficulties for filtered datasets only
    mappedPcaResults.forEach(result => {
        const normX = (result.x - minX) / (maxX - minX);
        const normY = (result.y - minY) / (maxY - minY);
        const difficultyScore = (normX + normY) / 2;
        const levelInfo = classifyDifficultyLevel(difficultyScore, statisticalModel);

        if (filteredResults.find(r => r.id === result.id) == undefined)
            return;

        const dataset = datasets.find(d => d.id === result.id);

        // Use statistical classification
        const difficultyPercent = Math.round(difficultyScore * 100);
        const difficultyDisplay = difficultyScore.toFixed(5);

        const container = document.createElement('div');
        container.style.marginBottom = '1rem';

        const nameEl = document.createElement('div');
        nameEl.innerHTML = `<strong>${dataset.name}</strong>`;
        container.appendChild(nameEl);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress';
        progressWrapper.style.height = '20px';

        const progressBar = document.createElement('div');
        progressBar.className = `progress-bar ${levelInfo.class}`;
        progressBar.role = 'progressbar';
        progressBar.style.width = `${difficultyPercent}%`;
        progressBar.setAttribute('aria-valuenow', difficultyPercent);
        progressBar.setAttribute('aria-valuemin', 0);
        progressBar.setAttribute('aria-valuemax', 100);
        progressBar.innerText = `${levelInfo.label} (${difficultyDisplay})`;

        progressWrapper.appendChild(progressBar);
        container.appendChild(progressWrapper);

        difficultyElement.appendChild(container);
    });
}
/**
 * Get confidence level and CSS class based on confidence score
 */
function getConfidence(confidence) {
  if (confidence >= 0.9) return { label: "Very High", className: "bg-success" };
  if (confidence >= 0.75) return { label: "High", className: "bg-primary" };
  if (confidence >= 0.5)
    return { label: "Moderate", className: "bg-warning text-dark" };
  if (confidence >= 0.25) return { label: "Low", className: "bg-danger" };
  return { label: "Very Low", className: "bg-secondary" };
}

/**
 * Clean up event listeners when disposing the module
 */
export function dispose() {
  // Remove main event listeners
  updatePcaButton.removeEventListener("click", updatePca);
  document
    .getElementById("aps-reset-graph-btn")
    .removeEventListener("click", resetGraph);
  document
    .getElementById("aps-export-png-btn")
    .removeEventListener("click", exportPngWithFeedback);
  document
    .getElementById("aps-export-csv-btn")
    .removeEventListener("click", exportCsvWithFeedback);
  document.querySelectorAll(".aps-selector").forEach((element) => {
    element.removeEventListener("change", checkStaleData);
  });

  metadataButton.removeEventListener("click", seeMetadata);

  // Remove clear highlight button listener
  clearHighlightButton.removeEventListener("click", clearDatasetHighlight);

  // Remove filter button listeners
  if (selectAllAlgorithmButton) {
    selectAllAlgorithmButton.removeEventListener("click", toggleAllAlgorithms);
  }
  if (selectAllDatasetButton) {
    selectAllDatasetButton.removeEventListener("click", toggleAllDatasets);
  }

  // Close any open modals and remove listeners
  closeAllModals();

  if (difficultiesInfoIcon) {
    difficultiesInfoIcon.removeEventListener("click", () => {});
  }

  if (similaritiesInfoIcon) {
    similaritiesInfoIcon.removeEventListener("click", () => {});
  }

  if (dissimilaritiesInfoIcon) {
    dissimilaritiesInfoIcon.removeEventListener("click", () => {});
  }

  // Remove escape key listener
  document.removeEventListener("keydown", () => {});
}