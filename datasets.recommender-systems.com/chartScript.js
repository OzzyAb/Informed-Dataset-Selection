import { getDatasetName, getAlgorithmName } from "./apiService.js";
import { fetchPerformanceResults } from "./apiService.js";

// Initial random datapoints
let xyValues = [
  { x: 0.05, y: 0.1, label: "1" },
  { x: 0.125, y: 0.125, label: "2" },
  { x: 0.13, y: 0.08, label: "3" },
  { x: 0.05, y: 0.85, label: "4" },
  { x: 0.25, y: 0.9, label: "5" },
  { x: 0.8, y: 0.95, label: "6" },
  { x: 0.85, y: 0.8, label: "7" },
  { x: 0.9, y: 0.08, label: "8" },
  { x: 0.85, y: 0.2, label: "9" },
  { x: 0.78, y: 0.1, label: "10" },
  { x: 0.4, y: 0.45, label: "11" },
  { x: 0.48, y: 0.55, label: "12" },
  { x: 0.55, y: 0.5, label: "13" },
  { x: 0.48, y: 0.4, label: "14" },
  { x: 0.5, y: 0.45, label: "15" },
  { x: 0.6, y: 0.45, label: "16" },
];

const numberMap = {
  one: 1,
  three: 3,
  five: 5,
  ten: 10,
  twenty: 20,
};

const performanceMetricsMap = {
  ndcg: "nDCG",
  hr: "HR",
  recall: "Recall",
};

// Chart instance variable
let chart;

function getKValue() {
  return document.getElementById("formKValue").value;
}

function getPerformanceMetric() {
  return document.getElementById("formPerformanceMetric").value;
}

function getFirstAlgorithmId() {
  return Number(document.getElementById("formControlAlgorithm1").value);
}

function getSecondAlgorithmId() {
  return Number(document.getElementById("formControlAlgorithm2").value);
}

// function to update xyValues with the latest performance results
export function updateXYValues(compareResults) {
  const kValue = getKValue();
  const performanceMetric = getPerformanceMetric();
  if (compareResults) {
    xyValues = compareResults.map((result) => {
      return {
        x: result.x[performanceMetric][kValue],
        y: result.y[performanceMetric][kValue],
        label: result.datasetId,
      };
    });
  }
}

// Function to initialize or update the chart
export function updateChart(firstAlgorithmId, secondAlgorithmId) {
  const ctx = document.getElementById("myChart");

  // Find the selected algorithms based on their IDs
  const firstAlgorithm = getAlgorithmName(firstAlgorithmId);
  const secondAlgorithm = getAlgorithmName(secondAlgorithmId);

  // If the chart already exists, destroy it before creating a new one
  if (chart) {
    chart.destroy();
  }
  // Create a new chart instance
  chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Datasets",
          pointRadius: 5,
          pointBackgroundColor: "rgb(200,20,0)",
          pointBorderWidth: 0,
          data: xyValues,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 0.95,
      scales: {
        x: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.25, // Controls the interval between tick marks
          },
          title: {
            display: true,
            text: `Performance of ${firstAlgorithm} (${
              performanceMetricsMap[getPerformanceMetric()]
            }@${numberMap[getKValue()]})`,
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        y: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.25,
          },
          title: {
            display: true,
            text: `Performance of ${secondAlgorithm} (${
              performanceMetricsMap[getPerformanceMetric()]
            }@${numberMap[getKValue()]})`,
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            generateLabels: function (chart) {
              const defaultLabels =
                Chart.defaults.plugins.legend.labels.generateLabels(chart);
              return [
                ...defaultLabels,
                {
                  text: `${secondAlgorithm} outperforms ${firstAlgorithm}`,
                  fillStyle: "rgba(0, 0, 255, 0.1)",
                  strokeStyle: "rgba(0, 0, 255, 0.5)",
                  lineWidth: 1,
                  hidden: false,
                },
                {
                  text: `${firstAlgorithm} outperforms ${secondAlgorithm}`,
                  fillStyle: "rgba(0, 255, 0, 0.1)",
                  strokeStyle: "rgba(0, 255, 0, 0.5)",
                  lineWidth: 1,
                  hidden: false,
                },
              ];
            },
          },
        },
        title: {
          display: true,
          text: `Performance Comparison: ${firstAlgorithm} vs ${secondAlgorithm} (${
            performanceMetricsMap[getPerformanceMetric()]
          }@${numberMap[getKValue()]})`,
          font: {
            size: 18,
            weight: "bold",
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const index = context.dataIndex;
              return [
                `Dataset Name: ${getDatasetName(index)}`,
                `X: ${xyValues[index].x}`,
                `Y: ${xyValues[index].y}`,
              ];
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "custom_diagonal_line",
        beforeDraw(chart) {
          const { ctx, chartArea, scales } = chart;

          // Draw the diagonal dashed line
          ctx.save();
          ctx.setLineDash([5, 5]); // Dashed line pattern
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(
            scales.x.getPixelForValue(0),
            scales.y.getPixelForValue(0)
          ); // Origin (0, 0)
          ctx.lineTo(
            scales.x.getPixelForValue(1),
            scales.y.getPixelForValue(1)
          ); // Top-right corner (1, 1)
          ctx.stroke();
          ctx.restore();

          // Fill the bottom triangle
          ctx.save();
          ctx.fillStyle = "rgba(0, 255, 0, 0.1)"; // Light red
          ctx.beginPath();
          ctx.moveTo(
            scales.x.getPixelForValue(0),
            scales.y.getPixelForValue(0)
          ); // Origin
          ctx.lineTo(
            scales.x.getPixelForValue(1),
            scales.y.getPixelForValue(1)
          ); // Top-right corner
          ctx.lineTo(
            scales.x.getPixelForValue(1),
            scales.y.getPixelForValue(0)
          ); // Bottom-right corner
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Fill the top triangle
          ctx.save();
          ctx.fillStyle = "rgba(0, 0, 255, 0.1)"; // Light blue
          ctx.beginPath();
          ctx.moveTo(
            scales.x.getPixelForValue(0),
            scales.y.getPixelForValue(0)
          ); // Origin
          ctx.lineTo(
            scales.x.getPixelForValue(1),
            scales.y.getPixelForValue(1)
          ); // Top-right corner
          ctx.lineTo(
            scales.x.getPixelForValue(0),
            scales.y.getPixelForValue(1)
          ); // Top-left corner
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        },
      },
      {
        id: "custom_labels",
        afterDraw(chart) {
          return;
          const { ctx } = chart;
          ctx.save();
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const dataset = chart.data.datasets[0];
          const meta = chart.getDatasetMeta(0);

          meta.data.forEach((point, index) => {
            const label = xyValues[index].label;
            const { x, y } = point.getCenterPoint();
            ctx.fillText(label, x, y);
          });
          ctx.restore();
        },
      },
    ],
  });
}

// function to handle dropdown changes
async function handleDropdownChange() {
  // Get the selected algorithm IDs from the dropdowns
  const firstAlgorithmId = Number(
    document.getElementById("formControlAlgorithm1").value
  );
  const secondAlgorithmId = Number(
    document.getElementById("formControlAlgorithm2").value
  );
  const results = await fetchPerformanceResults(
    firstAlgorithmId,
    secondAlgorithmId
  );
  if (results) {
    updateXYValues(results);
    updateChart(firstAlgorithmId, secondAlgorithmId);
  }
}

// Function to set up event listeners for dropdown changes
export function setupChartEventListeners() {
  // Event listeners for dropdown changes
  document
    .getElementById("formControlAlgorithm1")
    .addEventListener("change", handleDropdownChange);
  document
    .getElementById("formControlAlgorithm2")
    .addEventListener("change", handleDropdownChange);

  // Event listener for performance metric dropdown
  document
    .getElementById("formPerformanceMetric")
    .addEventListener("change", handleDropdownChange);

  // Event listener for K value dropdown
  document
    .getElementById("formKValue")
    .addEventListener("change", handleDropdownChange);
}
