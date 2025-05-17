class ChartHelper {
    #charts = [];

    /**
     * The usage of 'options' variable is as following:
     * 
     * ```js
     * {
     *   type: string
     *   data: {
     *     datasets: any[]
     *   },
     *   aspectRatio: number,
     *   title: string,
     *   labels: {
     *     showX: boolean,
     *     showY: boolean,
     *     customLabels: {
     *       id: any,
     *       value: any
     *     }
     *   },
     *   legend: {
     *     showDefault: boolean,
     *     customLegends: [
     *       title: string,
     *       lineWidth: number,
     *       lineColor: string,
     *       fillColor: string
     *     ]
     *   },
     *   zoom: boolean,
     *   points: {
     *     x: {
     *       min: number,
     *       max: number,
     *       stepSize: number,
     *       decimal: number
     *     },
     *     y: {
     *       min: number,
     *       max: number,
     *       stepSize: number,
     *       decimal: number
     *     }
     *   },
     *   shapes: [
     *     {
     *       type: string,
     *       style: string,
     *       lineWidth: number,
     *       lineColor: string,
     *       fillColor: string,
     *       features: any[]
     *     }
     *   ]
     * }
     * ```
     * 
     * For custom labels, make sure you add 'id' in your 'data'.
     * 
     * Every variables in 'options' is optional, except 'type' in the 'shapes' section
     * if and only if any shape needs to be drawn.
     * 
     * For drawin shapes, the usages of the variables are as following:
     * - 'type' can be either 'line' or 'circle'.
     * - 'style' can be either 'dashed' for a dashed line or nothing for a straight line.
     * - 'features' varies depending on the shape.
     *   - For lines: the first variable is a boolean. If true, the first and last dots are connected to each other.
     *     If false, they are not connected. The rest of the elements should be x and y values (numbers).
     *   - For circles: the first variable is a boolean. If true, it draws a filled circle with a color. If false,
     *     it only draws an empty circle. 2nd and 3rd variables are the center of the circle (x and y values).
     *     4th variable is the radius of the circle. 5th variable is the start angle (it should be between 0 and 360).
     *     6th variable controls how much of the circle needs to be drawn. For example, if 0.5 is given, it draws a half circle.
     * 
     */
    createChart(canvas, options) {
        let existingCanvas = this.#charts.find((value) => value.canvas == canvas);
        if (existingCanvas !== undefined) {
            existingCanvas.chart.destroy();
            existingCanvas.chart = null;
        }
        else {
            existingCanvas = {
                canvas: canvas,
                chart: null
            };
            this.#charts.push(existingCanvas);
        }

        const newChart = new Chart(canvas, {
            type: options.type ?? 'scatter',
            data: {
                datasets: options.datasets
            },
            options: {
                aspectRatio: options.aspectRatio ?? 1,
                plugins: {
                    title: options.title && {
                        text: options.title,
                        display: true,
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: options.labels && {
                            label: (context) => {
                                const labels = [];

                                if (options.labels.customLabels) {
                                    const id = context.raw?.id;
                                    labels.push(options.labels.customLabels[id]);
                                }
                                if (options.labels.showX) {
                                    labels.push(`X: ${context.parsed.x}`);
                                }
                                if (options.labels.showY) {
                                    labels.push(`Y: ${context.parsed.y}`);
                                }
                                
                                return labels;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        display: options.legend ? true : false,
                        labels: {
                            generateLabels: function (chart) {
                                let defaultLegends = [];
                                if (options.legend.showDefault) {
                                    defaultLegends = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                    defaultLegends = defaultLegends.map((value) => {
                                        const fillAlpha = '0.5';
                                        const lineAlpha = '0.75';

                                        let color = [];
                                        let start = value.fillStyle.indexOf('rgb');
                                        if (start !== -1) {
                                            let open = value.fillStyle.indexOf('(', start);
                                            let close = value.fillStyle.indexOf(')', open);
                                            if (open !== -1 || close !== -1) {
                                                let values = value.fillStyle.slice(open + 1, close).split(',').map(v => v.trim());
                                                color.push(values[0]);
                                                color.push(values[1]);
                                                color.push(values[2]);
                                                value.fillStyle = `rgba(${values[0]},${values[1]},${values[2]},${fillAlpha})`;
                                            }
                                        }

                                        if (color.length !== 0) {
                                            value.lineWidth = 1;
                                            value.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${lineAlpha})`;
                                        }

                                        return value;
                                    });
                                }

                                let customLegends = [];
                                if (options.legend?.customLegends !== undefined) {
                                    customLegends = options.legend.customLegends.map((value) => {
                                        return {
                                            text: value.title,
                                            lineWidth: value.lineWidth ?? 1,
                                            strokeStyle: value.lineColor ?? 'rgba(0, 0, 0, 0)',
                                            fillStyle: value.fillColor ?? 'rgba(0, 0, 0, 0)',
                                            hidden: false
                                        };
                                    });
                                }
                                
                                return [
                                    ...defaultLegends,
                                    ...customLegends
                                ];
                            },
                        }
                    },
                    zoom: options.zoom && {
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        }
                    }
                },
                scales: {
                    x: {
                        min: options.points?.x?.min ?? 0,
                        max: options.points?.x?.max ?? 1,
                        ticks: {
                            stepSize: options.points?.x?.stepSize ?? 0.25,
                            callback: (value) => value.toFixed(options.points?.x?.decimal ?? 2)
                        }
                    },
                    y: {
                        min: options.points?.y?.min ?? 0,
                        max: options.points?.y?.max ?? 1,
                        ticks: {
                            stepSize: options.points?.y?.stepSize ?? 0.25,
                            callback: (value) => value.toFixed(options.points?.y?.decimal ?? 2)
                        }
                    }
                }
            },
            plugins: options.shapes && options.shapes.map((shape, index) => {
                    return {
                        id: `shape_${index}`,
                        beforeDraw(chart) {
                            const { ctx, chartArea, scales } = chart;
                            if (shape.type === 'line') {
                                ctx.save();

                                if (shape.style === 'dashed') {
                                    ctx.setLineDash([5, 5]);
                                }
                                ctx.lineWidth = shape.lineWidth ?? 1;
                                ctx.strokeStyle = shape.lineColor ?? 'black';
                                ctx.fillStyle = shape.fillColor ?? 'rgba(0, 0, 0, 0)';

                                ctx.beginPath();
                                ctx.moveTo(
                                    scales.x.getPixelForValue(shape.features[1]),
                                    scales.y.getPixelForValue(shape.features[2])
                                );

                                for (let i = 3; i < shape.features.length; i += 2) {
                                    ctx.lineTo(
                                        scales.x.getPixelForValue(shape.features[i]),
                                        scales.y.getPixelForValue(shape.features[i + 1])
                                    )
                                }

                                if (shape.features[0]) {
                                    ctx.closePath();
                                    ctx.fill();
                                }
                                else {
                                    ctx.stroke();
                                }

                                ctx.restore();
                            }
                            else if (shape.type === 'circle') {
                                ctx.save();

                                if (shape.style === 'dashed') {
                                    ctx.setLineDash([5, 5]);
                                }

                                ctx.lineWidth = shape.lineWidth ?? 1;
                                ctx.strokeStyle = shape.lineColor ?? 'black';
                                ctx.fillStyle = shape.fillColor ?? 'rgba(0, 0, 0, 0)';
                                
                                ctx.beginPath();
                                ctx.arc(
                                    scales.x.getPixelForValue(shape.features[1]),
                                    scales.y.getPixelForValue(shape.features[2]),
                                    shape.features[3] * (chartArea.right - chartArea.left),
                                    shape.features[4] ? shape.features[4] * (Math.PI / 180) : 0,
                                    shape.features[5] ? 2 * Math.PI * shape.features[5] : 2 * Math.PI
                                );

                                if (shape.features[0]) {
                                    ctx.fill();
                                }
                                else {
                                    ctx.stroke();
                                }

                                ctx.restore();
                            }
                        }
                    }
                })
        });

        existingCanvas.chart = newChart;
    }

    resetZoom(canvas) {
        let existingCanvas = this.#charts.find((value) => value.canvas == canvas);
        if (existingCanvas !== undefined) {
            existingCanvas.chart.resetZoom();
        }
    }
}
