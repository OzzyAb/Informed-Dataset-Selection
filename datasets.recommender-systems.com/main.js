var tabContentElement = null;

document.addEventListener('DOMContentLoaded', async () => {
  tabContentElement = document.getElementById('tabContent');
  await loadTab('./tabs/compareAlgorithms/compareAlgorithms.html');
});

var activeTabScript = null;
async function loadTab(fileName) {
  Loading.showLoading();

  if (activeTabScript !== null) {
    activeTabScript.parentNode.removeChild(activeTabScript);
    activeTabScript.onload = null;
    activeTabScript = null;
  }
  
  await DynamicContent.loadContentToElement(fileName, tabContentElement);

  // Load the JS file related to the loaded tab
  const jsFileName = fileName.split('.html')[0] + '.js';
  const script = document.createElement('script');
  script.onload = async () => {
    await initialize();
    Loading.hideLoading();
  }
  script.src = jsFileName;
  script.id = jsFileName;
  document.head.appendChild(script);

  activeTabScript = script;
}











//import {
//  checkServerHealth,
//  fetchAlgorithms,
//  fetchDatasets,
//  fetchPcaResults,
//  populateSelectAlgorithm,
//  fetchPerformanceResults,
//} from "./apiService.js";
//
//import {
//  setupChartEventListeners,
//  updateXYValues,
//  updateChart,
//} from "./chartScript.js";
//
//import { setupPcaChartEventListeners } from "./pcaChartScript.js";
//
//import { updatePcaChart } from "./pcaChartScript.js";

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

  // 5. Initialize the PCA chart
  updatePcaChart();

  // 6. Set up event listeners for chart dropdowns
  setupChartEventListeners();

  // 7. Set up event listeners for PCA chart dropdowns
  setupPcaChartEventListeners();
});
