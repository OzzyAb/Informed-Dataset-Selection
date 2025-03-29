const xyValues = [
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

const ctx = document.getElementById("myChart");

const comp1 = 91.92;
const comp2 = 3.06;

new Chart(ctx, {
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
      display: true,
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
            labelString: "Component 1 - " + comp1 + "%",
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
            labelString: "Component 2 - " + comp2 + "%",
          },
        },
      ],
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
