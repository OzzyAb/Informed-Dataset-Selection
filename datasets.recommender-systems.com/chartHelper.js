import { versionNumber } from "./main.js";

export class ChartHelper {
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
     *   drawEllipseAroundDots: {
     *     show: boolean 
     *     color: string,
     *     legendTitle: string
     *   },
     *   verticalGradientBar: {
     *     topColor: string,
     *     topText, string,
     *     bottomText: string
     *   }
     *   aspectRatio: number,
     *   title: string,
     *   axisTitles: {
     *     x: {
     *       text: string,
     *       size: number,
     *       bold: boolean,
     *       color: string,
     *     },
     *     y: {
     *       text: string,
     *       size: number,
     *       bold: boolean,
     *       color: string,
     *     }
     *   }
     *   labels: {
     *     showX: boolean,
     *     showY: boolean,
     *     customLabels: {
     *       id: any,
     *       value: any
     *     }
     *   },
     *   legend: {
     *     show: true,
     *     filter: string[]
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
                    legend: options.legend && {
                        position: 'bottom',
                        display: options.legend.show,
                        labels: {
                            generateLabels: function (chart) {
                                const fillAlpha = '0.5';
                                const lineAlpha = '0.75';

                                let defaultLegends = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                if (options.legend.filter !== undefined) {
                                    defaultLegends = defaultLegends.filter(label => !options.legend.filter.includes(label.text));
                                }

                                const legends = defaultLegends.map((value) => {
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

                                return legends;
                            },
                        },
                        onClick: (e, legendItem, legend) => {
                            const index = legendItem.datasetIndex;
                            const chart = legend.chart;

                            const ellipseOptions = chart.options?.plugins?.drawEllipseAroundDots;
                            if (ellipseOptions && legendItem.text === ellipseOptions.legendTitle) {
                                ellipseOptions.show = !ellipseOptions.show;
                            }

                            if (chart.isDatasetVisible(index)) {
                                chart.hide(index);
                                legendItem.hidden = true;
                            } else {
                                chart.show(index);
                                legendItem.hidden = false;
                            };
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
                    },
                    drawEllipseAroundDots: options.drawEllipseAroundDots && {
                        show: options.drawEllipseAroundDots.show,
                        color: options.drawEllipseAroundDots.color,
                        legendTitle: options.drawEllipseAroundDots.legendTitle
                    },
                    verticalGradientBar: options.verticalGradientBar && {
                        topColor: options.verticalGradientBar.topColor,
                        topText: options.verticalGradientBar.topText,
                        bottomText: options.verticalGradientBar.bottomText
                    }
                },
                scales: {
                    x: {
                        title: options.axisTitles?.x && {
                            display: true,
                            text: options.axisTitles.x.text,
                            color: options.axisTitles.x.color,
                            font: {
                                size: options.axisTitles.x.size,
                                weight: options.axisTitles.x.bold ? 'bold' : 'normal'
                            }
                        },
                        min: options.points?.x?.min ?? 0,
                        max: options.points?.x?.max ?? 1,
                        ticks: {
                            stepSize: options.points?.x?.stepSize ?? 0.25,
                            callback: (value) => value.toFixed(options.points?.x?.decimal ?? 2)
                        }
                    },
                    y: {
                        title: options.axisTitles?.y && {
                            display: true,
                            text: options.axisTitles.y.text,
                            color: options.axisTitles.y.color,
                            font: {
                                size: options.axisTitles.y.size,
                                weight: options.axisTitles.y.bold ? 'bold' : 'normal'
                            }
                        },
                        min: options.points?.y?.min ?? 0,
                        max: options.points?.y?.max ?? 1,
                        ticks: {
                            stepSize: options.points?.y?.stepSize ?? 0.25,
                            callback: (value) => value.toFixed(options.points?.y?.decimal ?? 2)
                        }
                    }
                },
                layout: options.verticalGradientBar && {
                    padding: {
                        right: 30
                    }
                }
            },
            plugins: [
                ...(options.drawEllipseAroundDots ? [drawEllipseAroundDots] : []),
                ...(options.verticalGradientBar ? [verticalGradientBar] : []),
                ...(options.shapes ? options.shapes.map((shape, index) => {
                    return {
                        id: `shape_${index}`,
                        beforeDraw(chart) {
                            const { ctx, chartArea, scales } = chart;

                            if (shape.type === 'line') {
                                ctx.save();

                                ctx.beginPath();
                                ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                                ctx.clip();

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
                                    );
                                }

                                if (shape.features[0]) {
                                    ctx.closePath();
                                    ctx.fill();
                                } else {
                                    ctx.stroke();
                                }

                                ctx.restore();

                            } else if (shape.type === 'circle') {
                                ctx.save();

                                ctx.beginPath();
                                ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                                ctx.clip();

                                if (shape.style === 'dashed') {
                                    ctx.setLineDash([5, 5]);
                                }

                                ctx.lineWidth = shape.lineWidth ?? 1;
                                ctx.strokeStyle = shape.lineColor ?? 'black';
                                ctx.fillStyle = shape.fillColor ?? 'rgba(0, 0, 0, 0)';

                                const centerX = scales.x.getPixelForValue(shape.features[1]);
                                const centerY = scales.y.getPixelForValue(shape.features[2]);
                                const radiusPixels = shape.features[3] * (chartArea.right - chartArea.left);
                                const startAngle = shape.features[4] ? shape.features[4] * (Math.PI / 180) : 0;
                                const endAngle = shape.features[5] ? 2 * Math.PI * shape.features[5] : 2 * Math.PI;

                                ctx.beginPath();
                                ctx.arc(centerX, centerY, radiusPixels, startAngle, endAngle);

                                if (shape.features[0]) {
                                    ctx.fill();
                                } else {
                                    ctx.stroke();
                                }

                                ctx.restore();
                            }
                        }
                        
                    }
                }) : [])
            ]
        });

        existingCanvas.chart = newChart;
    }

    resetChart(canvas) {
        let existingCanvas = this.#charts.find((value) => value.canvas == canvas);
        if (existingCanvas !== undefined) {
            existingCanvas.chart.resetZoom();
        }
    }

       // MODIFIED: Alternative export method using OffscreenCanvas and toBlob to avoid fingerprinting warnings
    exportChartAsPng(chartName, canvas) {
        let existingCanvas = this.#charts.find((value) => value.canvas == canvas);
        if (existingCanvas === undefined)
            return;

        try {
            // Method 1: Try using OffscreenCanvas (most privacy-friendly)
            this.#exportUsingOffscreenCanvas(chartName, existingCanvas);
        } catch (error) {
            console.log('OffscreenCanvas not supported, trying alternative method...');
            try {
                // Method 2: Use toBlob instead of toDataURL (more privacy-friendly than toDataURL)
                this.#exportUsingToBlob(chartName, existingCanvas);
            } catch (blobError) {
                console.log('toBlob not supported, falling back to original method...');
                // Method 3: Fallback to original method if others fail
                this.#exportUsingDataURL(chartName, existingCanvas);
            }
        }
    }

    // NEW: Privacy-friendly export using OffscreenCanvas
    #exportUsingOffscreenCanvas(chartName, existingCanvas) {
        const originalCanvas = existingCanvas.canvas;
        const width = originalCanvas.width;
        const height = originalCanvas.height;

        // Create an OffscreenCanvas - this doesn't trigger fingerprinting warnings
        const offscreenCanvas = new OffscreenCanvas(width, height + 50);
        const offscreenCtx = offscreenCanvas.getContext('2d');

        // Set white background
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.fillRect(0, 0, width, height + 50);

        // Copy the chart image data
        const imageData = originalCanvas.getContext('2d').getImageData(0, 0, width, height);
        offscreenCtx.putImageData(imageData, 0, 0);

        // Add version and source text
        this.#addFooterText(offscreenCtx, width, height + 50);

        // Convert to blob and download
        offscreenCanvas.convertToBlob({ type: 'image/png' }).then(blob => {
            this.#downloadBlob(blob, `${chartName}-v${versionNumber}.png`);
        });
    }

    // NEW: Alternative export using toBlob (more privacy-friendly than toDataURL)
    #exportUsingToBlob(chartName, existingCanvas) {
        const originalCanvas = existingCanvas.canvas;
        const width = originalCanvas.width;
        const height = originalCanvas.height;

        // Create a regular canvas for combining
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height + 50;
        const finalCtx = finalCanvas.getContext('2d');

        // Set white background
        finalCtx.fillStyle = 'white';
        finalCtx.fillRect(0, 0, width, height + 50);

        // Copy the original canvas content
        finalCtx.drawImage(originalCanvas, 0, 0);

        // Add footer text
        this.#addFooterText(finalCtx, width, height + 50);

        // Use toBlob instead of toDataURL - this is less likely to trigger warnings
        finalCanvas.toBlob(blob => {
            this.#downloadBlob(blob, `${chartName}-v${versionNumber}.png`);
        }, 'image/png');
    }

    // MODIFIED: Original method as fallback (kept for compatibility)
    #exportUsingDataURL(chartName, existingCanvas) {
        const graphImage = existingCanvas.canvas.toDataURL('image/png');

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = existingCanvas.canvas.width;
        finalCanvas.height = existingCanvas.canvas.height + 50;
        const finalCtx = finalCanvas.getContext('2d');

        finalCtx.fillStyle = 'white';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        const img = new Image();
        img.src = graphImage;
        img.onload = () => {
            finalCtx.drawImage(img, 0, 0);
            this.#addFooterText(finalCtx, finalCanvas.width, finalCanvas.height);

            const link = document.createElement('a');
            link.download = `${chartName}-v${versionNumber}.png`;
            link.href = finalCanvas.toDataURL();
            link.click();
        };
    }

    // NEW: Helper method to add footer text 
    #addFooterText(ctx, width, height) {
        ctx.fillStyle = 'black';
        ctx.font = '18px Arial';

        const margin = 10;
        const versionText = `Version: ${versionNumber}`;
        const sourceText = 'Source: datasets.recommender-systems.com';

        ctx.fillText(sourceText, margin, height - 15);
        const versionWidth = ctx.measureText(versionText).width;
        ctx.fillText(versionText, width - versionWidth - margin, height - 15);
    }

    // NEW: Helper method to download blob 
    #downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        
        // Clean up the object URL to prevent memory leaks
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

const drawEllipseAroundDots = {
    id: 'drawEllipseAroundDots',
    afterDatasetsDraw(chart, args, options) {
        if (!options.show)
            return;

        const { ctx, chartArea, scales } = chart;

        ctx.save();

        ctx.beginPath();
        ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        ctx.clip();

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            const xScale = scales.x;
            const yScale = scales.y;

            meta.data.forEach((point, index) => {
                const dataPoint = dataset.data[index];

                const ellipseX = dataPoint.ellipseX;
                const ellipseY = dataPoint.ellipseY;

                const radiusX = Math.abs(xScale.getPixelForValue(dataPoint.x + ellipseX) - point.x);
                const radiusY = Math.abs(yScale.getPixelForValue(dataPoint.y + ellipseY) - point.y);

                ctx.beginPath();
                ctx.ellipse(point.x, point.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.strokeStyle = options.color;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });

        ctx.restore();
    }
};

const verticalGradientBar = {
    id: 'verticalGradientBar',
    afterDraw(chart, args, options) {
        const { ctx, chartArea } = chart;
        const { top, bottom, right } = chartArea;

        const gradient = ctx.createLinearGradient(0, bottom, 0, top);
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(1, options.topColor);

        const barWidth = 20;
        const x = right + 10;

        ctx.save();

        ctx.fillStyle = gradient;
        ctx.fillRect(x, top, barWidth, bottom - top);

        if (options.topText !== undefined || options.bottomText !== undefined) {
            ctx.fillStyle = 'black';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';

            const topText = options.topText ?? '';
            ctx.fillText(topText, x + barWidth / 2, top - 13);

            const bottomText = options.bottomText ?? '';
            ctx.fillText(bottomText, x + barWidth / 2, bottom + 15);
        }

        ctx.restore();
    }
};
