import { getDatasetName, getAlgorithmName } from "./apiService.js";

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

// Chart instance variable
let chart;

// function to update xyValues with the latest performance results
export function updateXYValues(compareResults) {
  // get the performance metric
  const performanceMetric = document.getElementById(
    "formPerformanceMetric"
  ).value;
  if (compareResults) {
    xyValues = compareResults.map((result) => {
      // the final x (y) value is the average of the five datapoints of the according performance metric
      const xValue = Object.keys(result.x[performanceMetric]).reduce(
        (avg, key, _, { length }) =>
          avg + result.x[performanceMetric][key] / length,
        0
      );
      const yValue = Object.keys(result.y[performanceMetric]).reduce(
        (avg, key, _, { length }) =>
          avg + result.y[performanceMetric][key] / length,
        0
      );
      return {
        x: xValue,
        y: yValue,
        label: result.datasetId,
      };
    });
  }
}

// Function to put in new data into the chart
export function updateChartData() {
  chart.data.datasets[0].data = xyValues;
  chart.update();
}

// Function to initialize or update the chart
function updateChart(xLabel, yLabel) {
  const ctx = document.getElementById("myChart");

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
          pointRadius: 10,
          pointBackgroundColor: "rgb(200,20,0)",
          data: xyValues,
        },
      ],
    },
    options: {
      title: {
        display: false,
        text: "Algorithm Performance Space",
      },
      aspectRatio: 1,
      legend: { display: false },
      scales: {
        xAxes: [
          {
            ticks: {
              min: 0,
              max: 1,
              stepSize: 0.25, // Controls the interval between tick marks
            },
            scaleLabel: {
              display: true,
              labelString: xLabel,
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              min: 0,
              max: 1,
              stepSize: 0.25,
            },
            scaleLabel: {
              display: true,
              labelString: yLabel,
            },
          },
        ],
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const index = tooltipItem.index;
            const label = xyValues[index].label;
            return [
              `Dataset Name: ${getDatasetName(tooltipItem.index)}`,
              `X: ${xyValues[index].x}`,
              `Y: ${xyValues[index].y}`,
            ];
          },
        },
      },
    },
    plugins: [
      {
        afterDraw: (chart) => {
          const ctx = chart.ctx;
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
        },
      },
    ],
  });
}

// function to handle dropdown changes
function handleDropdownChange() {
  // Get the selected algorithm IDs from the dropdowns
  const firstAlgorithmId = Number(
    document.getElementById("formControlAlgorithm1").value
  );
  const secondAlgorithmId = Number(
    document.getElementById("formControlAlgorithm2").value
  );

  // Find the selected algorithms based on their IDs
  const firstAlgorithm = getAlgorithmName(firstAlgorithmId);
  const secondAlgorithm = getAlgorithmName(secondAlgorithmId);

  // Update the chart title based on selected algorithms
  chart.options.title.text = `Performance Comparison: ${firstAlgorithm} vs ${secondAlgorithm}`;
  updateChart(firstAlgorithm, secondAlgorithm);
}

// Event listeners for dropdown changes
document
  .getElementById("formControlAlgorithm1")
  .addEventListener("change", handleDropdownChange);
document
  .getElementById("formControlAlgorithm2")
  .addEventListener("change", handleDropdownChange);

// Initial call to set up the chart with default labels
updateChart("Algorithm 1", "Algorithm 2");
