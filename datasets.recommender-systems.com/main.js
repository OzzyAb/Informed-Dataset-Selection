import {
  checkServerHealth,
  fetchAlgorithms,
  fetchDatasets,
  fetchPcaResults,
  populateSelectAlgorithm,
  fetchPerformanceResults,
} from "./apiService.js";

import {
  setupChartEventListeners,
  updateXYValues,
  updateChart,
} from "./chartScript.js";

// This function is called once the DOM is fully loaded
// It initializes the chart and fetches data from the server
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check server health
  const isServerOnline = await checkServerHealth();

  // 2. If the server is online, fetch algorithms
  // and the datasets
  if (isServerOnline) {
    await fetchAlgorithms();
    await fetchDatasets();
    await fetchPcaResults();
  }

  // 3. Populate the dropdowns (can be called later as needed)
  populateSelectAlgorithm();

  // 4. Fetch performance results for the default algorithms
  const performanceResults = await fetchPerformanceResults(1, 2);
  if (performanceResults) {
    updateXYValues(performanceResults); // Update the chart data
    updateChart(1, 2); // Render the chart
  }

  // 4. Set up event listeners for chart dropdowns
  setupChartEventListeners();
});
