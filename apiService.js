// API base URL
const apiUrl = "https://datasets-rec-sys-2nt6.onrender.com";
// URL to fetch algorithm related data
const algorithmUrl = `${apiUrl}/algorithm`;
// URL to fetch dataset related data
const datasetUrl = `${apiUrl}/dataset`;
// URL to fetch server status
const serverStatusUrl = `${apiUrl}/health`;

let algorithms = [];

export async function checkServerHealth() {
  const statusIndicator = document.getElementById("server-status");
  try {
    const response = await fetch(serverStatusUrl);
    if (response.ok) {
      statusIndicator.textContent = "Server is online";
      statusIndicator.className = "online";
      statusIndicator.innerHTML =
        '<i class="fas fa-check-circle"></i> Server is online';
      return true;
    } else {
      throw new Error("Server is not healthy");
    }
  } catch (error) {
    statusIndicator.textContent = "Server is offline";
    statusIndicator.className = "offline";
    statusIndicator.innerHTML =
      '<i class="fas fa-times-circle"></i> Server is offline';
    return false;
  }
}

export async function fetchAlgorithms() {
  try {
    const response = await fetch(algorithmUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    algorithms = data.data;
  } catch (error) {
    console.error("Error fetching algorithm data:", error);
    return [];
  }
}

export function populateSelectAlgorithm() {
  const firstAlgorithm = document.getElementById("select-first-algorithm");
  const secondAlgorithm = document.getElementById("select-second-algorithm");

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
}

export function getAlgorithms() {
  return algorithms;
}
