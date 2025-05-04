import { fetchPcaResults, checkServerHealth } from "./apiService.js";

let pcaChart;

async function initializePcaChart() {
  // Check if the server is online
  const serverIsOnline = await checkServerHealth();
  if (!serverIsOnline) {
    console.error("Server is offline. Cannot fetch PCA results.");
    return;
  }

  try {
    // Fetch PCA results from the server
    const pcaData = await fetchPcaResults();
    console.log(pcaData);

    // Prepare the data for the chart
    const chartData = pcaData.map((point) => ({
      x: point.x, // Replace with the actual x-coordinate field from the server response
      y: point.y, // Replace with the actual y-coordinate field from the server response
    }));

    // Get the chart context
    const ctx = document.getElementById("pca-chart");

    // Destroy the existing chart if it exists
    if (pcaChart) {
      pcaChart.destroy();
    }

    // Create a new chart
    pcaChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "PCA Results",
            data: chartData,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            title: {
              display: true,
              text: "Principal Component 1",
            },
          },
          y: {
            title: {
              display: true,
              text: "Principal Component 2",
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error initializing PCA chart:", error);
  }
}

// Initialize the PCA chart when the page loads
window.addEventListener("load", initializePcaChart);
