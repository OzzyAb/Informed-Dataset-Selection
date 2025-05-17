var datasets = null;

var dataset1SelectElement = null;
var dataset2SelectElement = null;
var tableHeadElement = null;
var tableBodyElement = null;

var infoElements = {};

var metadataElements = [
    { name: 'Number of Users', key: 'numberOfUsers', better: 'higher' },
    { name: 'Number of Items', key: 'numberOfItems', better: 'higher' },
    { name: 'Number of Interactions', key: 'numberOfInteractions', better: 'higher' },
    { name: 'User-Item Ratio', info: 'user-item-ratio-info', key: 'userItemRatio', fixed: 2, better: 'range', rangeDescription: [
        {
            value: [0, 0.1],
            color: 'text-danger'
        },
        {
            value: [0.1, 0.2],
            color: 'text-warning'
        },
        {
            value: [0.2, 1],
            color: 'text-success'
        },
        {
            value: [1, 2],
            color: 'text-success'
        },
        {
            value: [2, 5],
            color: 'text-warning'
        },
        {
            value: [5, 10],
            color: 'text-danger'
        },
        {
            value: [10, Number.MAX_VALUE],
            color: 'text-danger'
        }]
    },
    { name: 'Density', key: 'density', fixed: 2, better: 'higher' },
    { name: 'Feedback Type', key: 'feedbackType' },
    { name: 'Max Rating/User', description: 'Highest Number of Rating By Single User', key: 'highestNumberOfRatingBySingleUser' },
    { name: 'Min Rating/User', description: 'Lowest Number of Rating By Single User', key: 'lowestNumberOfRatingBySingleUser' },
    { name: 'Max Rating/Item', description: 'Highest Number of Rating On Single Item', key: 'highestNumberOfRatingOnSingleItem' },
    { name: 'Min Rating/Item', description: 'Lowest Number of Rating On Single Item', key: 'lowestNumberOfRatingOnSingleItem', fixed: 2 },
    { name: 'Average Ratings/User', description: 'Mean Number of Ratings By User', info: 'mean-ratings-per-user-info', key: 'meanNumberOfRatingsByUser', fixed: 2, better: 'range', rangeDescription: [
        {
            value: [0, 5],
            color: 'text-danger'
        },
        {
            value: [5, 20],
            color: 'text-warning'
        },
        {
            value: [20, 50],
            color: 'text-success'
        },
        {
            value: [50, 100],
            color: 'text-warning'
        },
        {
            value: [100, Number.MAX_VALUE],
            color: 'text-danger'
        }]
    },
    { name: 'Average Ratings/Item', description: 'Mean Number of Ratings On Item', info: 'mean-ratings-per-item-info', key: 'meanNumberOfRatingsOnItem', fixed: 2, better: 'range', rangeDescription: [
        {
            value: [0, 5],
            color: 'text-danger'
        },
        {
            value: [5, 20],
            color: 'text-warning'
        },
        {
            value: [20, 50],
            color: 'text-success'
        },
        {
            value: [50, 100],
            color: 'text-warning'
        },
        {
            value: [100, Number.MAX_VALUE],
            color: 'text-danger'
        }]
    }
];

async function initialize() {
    infoElements['user-item-ratio-info'] = document.getElementById('user-item-ratio-info');
    infoElements['user-item-ratio-info-p'] = document.getElementById('user-item-ratio-info-p');
    infoElements['mean-ratings-per-user-info'] = document.getElementById('mean-ratings-per-user-info');
    infoElements['mean-ratings-per-user-info-p'] = document.getElementById('mean-ratings-per-user-info-p');
    infoElements['mean-ratings-per-item-info'] = document.getElementById('mean-ratings-per-item-info');
    infoElements['mean-ratings-per-item-info-p'] = document.getElementById('mean-ratings-per-item-info-p');
    document.body.appendChild(infoElements['user-item-ratio-info']);
    document.body.appendChild(infoElements['mean-ratings-per-user-info']);
    document.body.appendChild(infoElements['mean-ratings-per-item-info']);

    dataset1SelectElement = document.getElementById('dataset-selection-1');
    dataset2SelectElement = document.getElementById('dataset-selection-2');

    const table = document.querySelector("#dataset-table");
    tableHeadElement = table.querySelector("thead");
    tableBodyElement = table.querySelector("tbody");
    
    datasets = await ApiService.getDatasets();

    dataset1SelectElement.innerHTML = '';
    dataset2SelectElement.innerHTML = '';
    tableBodyElement.innerHTML = '';

    datasets.forEach((dataset) => {
        const option1 = document.createElement('option');
        option1.value = dataset.id;
        option1.textContent = dataset.name;
        dataset1SelectElement.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = dataset.id;
        option2.textContent = dataset.name;
        dataset2SelectElement.appendChild(option2);
    });

    dataset1SelectElement.value = datasets[0].id;
    if (datasets.length > 1) {
        dataset2SelectElement.value = datasets[1].id;
    }
    else {
        dataset2SelectElement.value = datasets[0].id;
    }

    compareDatasets();
}

function compareDatasets() {
    const dataset1 = datasets.find((dataset) => dataset.id == Number(dataset1SelectElement.value));
    const dataset2 = datasets.find((dataset) => dataset.id == Number(dataset2SelectElement.value));

    tableHeadElement.innerHTML = `
      <tr>
        <th style="text-align: center; vertical-align: middle; width: 100px; background-color: #ECF5FC;">Metadata</th>
        <th style="text-align: center; vertical-align: middle; width: 200px; background-color: #ECF5FC;">${dataset1.name}</th>
        <th style="text-align: center; vertical-align: middle; width: 200px; background-color: #ECF5FC;">${dataset2.name}</th>
      </tr>
    `;
    tableBodyElement.innerHTML = '';
    
    metadataElements.forEach(metadata => {
        const tr = document.createElement('tr');
        const tdMetadata = document.createElement('td');
        const tdDataset1 = document.createElement('td');
        const tdDataset2 = document.createElement('td');

        tdMetadata.style = 'text-align: left; vertical-align: middle; white-space: nowrap;';
        tdMetadata.textContent = metadata.name;
        if (metadata.description !== undefined) {
            tdMetadata.title = metadata.description;
        }
        if (metadata.info !== undefined) {
            const infoIcon = document.createElement('span');
            infoIcon.innerHTML = ' &#8505;';
            infoIcon.style.color = '#0d6efd';
            infoIcon.style.cursor = 'pointer';
            infoIcon.style.marginLeft = '5px';

            infoIcon.addEventListener('mouseenter', (e) => {
                infoElements[metadata.info].style.display = 'block';
                infoElements[metadata.info].style.left = e.pageX + 10 + 'px';
                infoElements[metadata.info].style.top = e.pageY + 10 + 'px';
            });

            infoIcon.addEventListener('mousemove', (e) => {
                const tooltip = infoElements[metadata.info];
                tooltip.style.display = 'block';

                const tooltipRect = tooltip.getBoundingClientRect();
                const pageWidth = window.innerWidth;
                const pageHeight = window.innerHeight;

                let left = e.pageX + 10;
                let top = e.pageY + 10;

                if (left + tooltipRect.width > pageWidth) {
                    left = e.pageX - tooltipRect.width - 10;
                }

                if (top + tooltipRect.height > pageHeight) {
                    top = e.pageY - tooltipRect.height - 10;
                }

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            });

            infoIcon.addEventListener('mouseleave', () => {
                infoElements[metadata.info].style.display = 'none';
            });

            tdMetadata.appendChild(infoIcon);
        }

        tdDataset1.style = 'text-align: center; vertical-align: middle;';
        tdDataset2.style = 'text-align: center; vertical-align: middle;';

        const value1 = metadata.fixed === undefined ? dataset1[metadata.key] : dataset1[metadata.key].toFixed(2);
        const value2 = metadata.fixed === undefined ? dataset2[metadata.key] : dataset2[metadata.key].toFixed(2);
        let color1 = null;
        let color2 = null;
        if (metadata.better !== undefined) {
            if (metadata.better === 'higher') {
                if (value1 > value2) {
                    color1 = 'text-success';
                }
                else if (value2 > value1) {
                    color2 = 'text-success';
                }
            }
            else if (metadata.better === 'lower') {
                if (value1 < value2) {
                    color1 = 'text-success';
                }
                else if (value2 < value1) {
                    color2 = 'text-success';
                }
            }
            else if (metadata.better === 'range') {
                for (const description of metadata.rangeDescription) {
                    if (value1 >= description.value[0] && value1 <= description.value[1]) {
                        color1 = description.color;
                    }
                    if (value2 >= description.value[0] && value2 <= description.value[1]) {
                        color2 = description.color;
                    }
                }
            }
        }

        if (metadata.key === 'feedbackType') {
            tdDataset1.textContent = capitalizeFirstLetter(value1);
            tdDataset2.textContent = capitalizeFirstLetter(value2);
        }
        else {
            tdDataset1.textContent = value1;
            tdDataset2.textContent = value2;
        }
        
        if (color1 != null) {
            tdDataset1.classList.add(color1);
        }
        if (color2 != null) {
            tdDataset2.classList.add(color2);
        }

        tr.appendChild(tdMetadata);
        tr.appendChild(tdDataset1);
        tr.appendChild(tdDataset2);
        tableBodyElement.appendChild(tr);
    });
}
