// API base URL
const apiUrl = "https://datasets.recommender-systems.com";
const dbPrefix = "/index.php?action=";
// URL to fetch algorithm related data
const algorithmUrl = `${apiUrl}${dbPrefix}algorithm`;
// URL to fetch dataset related data
const datasetUrl = `${apiUrl}${dbPrefix}dataset`;
// URL to fetch server status
const serverStatusUrl = `${apiUrl}/health.php`;
// URL to fetch performance results of two algorithms
const performanceUrl = (a1, a2) =>
  `${apiUrl}${dbPrefix}result&task=compareAlgorithms&x=${a1}&y=${a2}`;
// URL to fetch PCA results
const pcaUrl = `${apiUrl}${dbPrefix}result&task=pcaResults`;

let algorithms = [];
let datasets = [];
let compareResults = {};

// function get the compare results
export function getCompareResults() {
  return compareResults;
}

// function to fetch the dataset names
export async function fetchDatasets() {
  try {
    const response = await fetch(datasetUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    data.data.sort((a, b) => a.name.localeCompare(b.name));
    datasets = data.data;
  } catch (error) {
    console.error("Error fetching dataset data:", error);
    return [];
  }
}

export async function checkServerHealth() {
  const statusIndicator = document.getElementById("server-status");
  try {
    const response = await fetch(serverStatusUrl);
    if (response.ok) {
      statusIndicator.textContent = "Server is online";
      statusIndicator.className =
        "badge bg-success-subtle text-success-emphasis rounded-pill";
      statusIndicator.innerHTML = "Server is online";
      return true;
    } else {
      throw new Error("Server is not healthy");
    }
  } catch (error) {
    statusIndicator.textContent = "Server is offline";
    statusIndicator.className = "badge text-bg-danger";
    statusIndicator.innerHTML =
      '<i class="fas fa-times-circle"></i> Server is offline';
    return false;
  }
}

// function to fetch performance results of two algorithms
export async function fetchPerformanceResults(
  firstAlgorithmId,
  secondAlgorithmId
) {
  try {
    const response = await fetch(
      performanceUrl(firstAlgorithmId, secondAlgorithmId)
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    //console.log(data);
    return data.data;
  } catch (error) {
    console.error("Error fetching performance results:", error);
    return null;
  }
}

export async function fetchAlgorithms() {
  try {
    const response = await fetch(algorithmUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    data.data.sort((a, b) => a.name.localeCompare(b.name));
    algorithms = data.data;
  } catch (error) {
    console.error("Error fetching algorithm data:", error);
    return [];
  }
}

/*
  function to populate the algorithm select dropdowns
  with the fetched algorithms
  initially select the first two algorithms
 */
export function populateSelectAlgorithm() {
  const firstAlgorithm = document.getElementById("formControlAlgorithm1");
  const secondAlgorithm = document.getElementById("formControlAlgorithm2");

  // Clear existing options
  firstAlgorithm.innerHTML = "";
  secondAlgorithm.innerHTML = "";

  algorithms.forEach((algorithm) => {
    // Create a new option for the first select
    const option1 = document.createElement("option");
    option1.value = algorithm.id;
    option1.textContent = algorithm.name;
    firstAlgorithm.appendChild(option1);

    // Create a new option for the second select
    const option2 = document.createElement("option");
    option2.value = algorithm.id;
    option2.textContent = algorithm.name;
    secondAlgorithm.appendChild(option2);
  });

  // Select the first two algorithms by default
  if (algorithms.length > 1) {
    firstAlgorithm.value = algorithms[0].id;
    secondAlgorithm.value = algorithms[1].id;
  }
}

export async function fetchPcaResults() {
  try {
    const response = await fetch(pcaUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    //console.log(data);
    return data.data;
  } catch (error) {
    console.error("Error fetching PCA results:", error);
    return null;
  }
}

export function getAlgorithms() {
  return algorithms;
}

export function getAlgorithmName(id) {
  const algorithm = algorithms.find((alg) => alg.id === id);
  return algorithm ? algorithm.name : "";
}

export function getDatasetName(id) {
  const dataset = datasets.find((ds) => ds.id === id);
  return dataset ? dataset.name : "";
}
