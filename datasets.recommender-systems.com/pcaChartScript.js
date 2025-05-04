import { getPcaData } from "./apiService.js";
import { getKValuePca, getPerformanceMetricPca } from "./formUtils.js";
import { getDatasetName } from "./apiService.js";

let pcaChart;

export async function updatePcaChart() {
  // Get the previously fetched PCA data
  const pcaData = getPcaData();
  const kValue = getKValuePca();
  const performanceMetric = getPerformanceMetricPca();

  // Prepare the data for the chart
  const chartData = pcaData.map((point) => ({
    x: point[performanceMetric][kValue].x,
    y: point[performanceMetric][kValue].y,
    label: point.datasetId,
  }));

  // Destroy the existing chart if it exists
  if (pcaChart) {
    // Update the existing chart's data
    pcaChart.data.datasets[0].data = chartData;
    pcaChart.update();
  } else {
    // Get the chart context
    const ctx = document.getElementById("pca-chart");

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
              text: "Component 1",
              font: {
                size: 14,
                weight: "bold",
              },
            },
          },
          y: {
            title: {
              display: true,
              text: "Component 2",
              font: {
                size: 14,
                weight: "bold",
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const index = context.dataIndex;
                return [
                  `Dataset Name: ${getDatasetName(index)}`,
                  `X: ${chartData[index].x}`,
                  `Y: ${chartData[index].y}`,
                ];
              },
            },
          },
        },
      },
    });
  }
}

export function setupPcaChartEventListeners() {
  document
    .getElementById("formKValuePca")
    .addEventListener("change", updatePcaChart);
  document
    .getElementById("formPerformanceMetricPca")
    .addEventListener("change", updatePcaChart);
}
