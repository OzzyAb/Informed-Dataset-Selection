import { ApiService } from "../../apiService.js";
import { capitalizeFirstLetter } from "../../util.js";

var datasets = null;
var selectedDatasets = [];

var tableBodyElement = null;
var tableHeadElement = null;

let currentSortKey = null;
let currentSortDirection = 'asc'; // 'asc' oder 'desc'
var infoElements = {};

var datasetFilterHeaderElement = null;
var datasetFilterArea = null;
var datasetFilterCheckboxes = [];

var selectAllDatasetArea = null;
var selectAllDatasetButton = null;
var selectAllDatasetButtonText = null;

var metadataElements = [
    { name: 'Name', key: 'name', better: 'higher'},
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
    { name: 'Max Rating/User', description: 'Highest Number of Rating By Single User', key: 'highestNumberOfRatingBySingleUser' },
    { name: 'Min Rating/User', description: 'Lowest Number of Rating By Single User', key: 'lowestNumberOfRatingBySingleUser' },
    { name: 'Max Rating/Item', description: 'Highest Number of Rating On Single Item', key: 'highestNumberOfRatingOnSingleItem' },
    { name: 'Min Rating/Item', description: 'Lowest Number of Rating On Single Item', key: 'lowestNumberOfRatingOnSingleItem', fixed: 2 },
    { name: 'Mean Ratings/User', description: 'Mean Number of Ratings By User', info: 'mean-ratings-per-user-info', key: 'meanNumberOfRatingsByUser', fixed: 2, better: 'range', rangeDescription: [
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
    { name: 'Mean Ratings/Item', description: 'Mean Number of Ratings On Item', info: 'mean-ratings-per-item-info', key: 'meanNumberOfRatingsOnItem', fixed: 2, better: 'range', rangeDescription: [
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

export async function initialize() {

    infoElements['user-item-ratio-info'] = document.getElementById('user-item-ratio-info');
    infoElements['user-item-ratio-info-p'] = document.getElementById('user-item-ratio-info-p');
    infoElements['mean-ratings-per-user-info'] = document.getElementById('mean-ratings-per-user-info');
    infoElements['mean-ratings-per-user-info-p'] = document.getElementById('mean-ratings-per-user-info-p');
    infoElements['mean-ratings-per-item-info'] = document.getElementById('mean-ratings-per-item-info');
    infoElements['mean-ratings-per-item-info-p'] = document.getElementById('mean-ratings-per-item-info-p');

    document.body.appendChild(infoElements['user-item-ratio-info']);
    document.body.appendChild(infoElements['mean-ratings-per-user-info']);
    document.body.appendChild(infoElements['mean-ratings-per-item-info']);

    const table = document.querySelector("#dataset-table");
    tableHeadElement = table.querySelector("thead");
    tableBodyElement = table.querySelector("tbody");

    document.querySelectorAll('.compareDatasets').forEach(element => {
        element.addEventListener('change', compareDatasets);
    });

    datasets = await ApiService.getDatasets();
    createSelectAllButtons();
    

    datasetFilterHeaderElement = document.getElementById('dataset-comparison-header');
    datasetFilterArea = document.getElementById('dataset-comparison-filter');

    datasetFilterHeaderElement.innerText = '(All selected)';
    datasetFilterArea.innerHTML = '';
    datasetFilterArea.appendChild(selectAllDatasetArea);

    datasetFilterCheckboxes = [];
    selectedDatasets = [];
    datasets.forEach(dataset => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = dataset.id;
        checkbox.name = 'datasetCheckbox';
        checkbox.value = dataset.name;
        checkbox.checked = true;
        checkbox.onchange = onFilterDataset;

        const label = document.createElement('label');
        label.htmlFor = dataset.id;
        label.textContent = dataset.name;
        label.style.marginLeft = '0.25rem';

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        datasetFilterArea.appendChild(wrapper);
        datasetFilterCheckboxes.push(checkbox);
        selectedDatasets.push(dataset.id);
    });

    tableBodyElement.innerHTML = '';
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-key');

            if (currentSortKey === key) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = key;
                currentSortDirection = 'asc';
            }

            compareDatasets();
            initializeTooltips();
        });
    });

    
    currentSortKey = 'name';
    currentSortDirection = 'asc';
    compareDatasets();
    initializeTooltips();
    
}

async function onFilterDataset(e) {
    const datasetId = Number(e.target.id);

    if (e.target.checked) {
        selectedDatasets.push(datasetId);
    } else {
        const index = selectedDatasets.indexOf(datasetId);
        if (index > -1) {
            selectedDatasets.splice(index, 1);
        }
    }

    if (selectedDatasets.length === 0) {
        datasetFilterHeaderElement.innerText = '(None selected)';
    } else if (selectedDatasets.length === datasets.length) {
        datasetFilterHeaderElement.innerText = '(All selected)';
    } else {
        datasetFilterHeaderElement.innerText = '(Some selected)';
    }

    await compareDatasets();
}

function compareDatasets() {
    const selectedDatasetIds = Array.from(document.querySelectorAll('#dataset-comparison-filter input[type="checkbox"]:checked'))
        .map(cb => Number(cb.id));

    selectedDatasets = datasets.filter(d => selectedDatasetIds.includes(d.id));

    if (currentSortKey) {
        selectedDatasets = sortDatasets(selectedDatasets, currentSortKey);
    }

    const tableBodyElement = document.querySelector('#dataset-table tbody');
    tableBodyElement.innerHTML = '';

    selectedDatasets.forEach(dataset => {
        const tr = document.createElement('tr');

        const cells = metadataElements.map(meta => {
            const value = dataset[meta.key];
            const decimals = meta.fixed ?? 0;
            return `<td data-key="${meta.key}">${formatValue(value, decimals)}</td>`;
        });

        tr.innerHTML = cells.join('');
        tableBodyElement.appendChild(tr);
    });

    updateSortIcons();
    const table = document.querySelector("#dataset-table");
    colorNumbersOnly(table);
} 

function createSelectAllButtons() {

    selectAllDatasetArea = document.createElement('div');
    selectAllDatasetArea.style.width = '100%';

    selectAllDatasetButton = document.createElement('button');
    selectAllDatasetButton.type = 'button';
    selectAllDatasetButton.className = 'filter-control-btn';
    selectAllDatasetButton.addEventListener('click', toggleAllDatasets);

    let icon = document.createElement('i');
    icon.className = 'fa-solid fa-filter';
    icon.style.setProperty('color', 'white', 'important');
    icon.style.marginRight = '0.3rem';

    selectAllDatasetButtonText = document.createElement('span');
    selectAllDatasetButtonText.textContent = 'Deselect All';

    selectAllDatasetButton.appendChild(icon);
    selectAllDatasetButton.appendChild(selectAllDatasetButtonText);
    selectAllDatasetArea.appendChild(selectAllDatasetButton);
}

function toggleAllDatasets() {
    const checkedCount = selectedDatasets.length;
    const shouldCheck = checkedCount !== datasetFilterCheckboxes.length;

    datasetFilterCheckboxes.forEach(checkbox => {
        checkbox.checked = shouldCheck;
    });

    selectedDatasets = shouldCheck ? datasets.map(dataset => dataset.id) : [];

    updateFilterHeader(datasetFilterCheckboxes, datasetFilterHeaderElement, selectedDatasets, datasets);
    updateSelectAllButtonText(datasetFilterCheckboxes, selectAllDatasetButtonText, selectedDatasets);
    checkStaleData();
}
function updateFilterHeader(checkboxes, header, selection, list) {
    const checkedCount = selection.length;

    if (checkedCount === checkboxes.length) {
        header.innerText = '(All selected)';
    } else if (checkedCount === 0) {
        header.innerText = '(None selected)';
    } else if (checkedCount === 1) {
        const selectedCheckbox = checkboxes.find(checkbox => checkbox.checked);
        const selectedId = Number(selectedCheckbox.id.split('-')[1]);
        const selected = list.find(x => x.id === selectedId);
        header.innerText = `(${selected.name})`;
    } else {
        header.innerText = `(${checkedCount} selected)`;
    }
}

function updateSelectAllButtonText(checkboxes, text, selection) {
    const checkedCount = selection.length;
    if (checkedCount === checkboxes.length) {
        text.textContent = 'Deselect All';
    } else {
        text.textContent = 'Select All';
    }
}
 


function sortDatasets(datasets, key) {
    return datasets.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA === undefined || valB === undefined) return 0;

        if (typeof valA === 'string') {
            return currentSortDirection === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else {
            return currentSortDirection === 'asc'
                ? valA - valB
                : valB - valA;
        }
    });
}


function updateSortIcons() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const key = th.getAttribute('data-key');
        const icon = th.querySelector('.sort-icon');
        if (key === currentSortKey) {
            icon.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
        } else {
            icon.textContent = '';
        }
    });
}

function formatValue(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
}

function initializeTooltips() {
    document.querySelectorAll('.tooltip-icon').forEach(icon => {
        const tooltipId = icon.dataset.tooltipId;
        const tooltip = document.getElementById(tooltipId);

        if (!tooltip) return;

        icon.addEventListener('mouseenter', (e) => {
            tooltip.style.display = 'block';
            positionTooltip(e, tooltip);
        });

        icon.addEventListener('mousemove', (e) => {
            positionTooltip(e, tooltip);
        });

        icon.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

function positionTooltip(e, tooltip) {
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
}

function colorNumbersOnly(table) {
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');

        cells.forEach((cell, index) => {
            const content = cell.textContent.trim();
            const match = content.match(/[-+]?[0-9]*\.?[0-9]+/);
            if (!match) return;

            const value = parseFloat(match[0]);
            const key = cell.getAttribute('data-key');
            const meta = metadataElements.find(m => m.key === key);

            if (!meta || !meta.rangeDescription) return; 

            let colorClass = null;
            for (const range of meta.rangeDescription) {
                const [min, max] = range.value;
                if (value >= min && value < max) {
                    colorClass = range.color;
                    break;
                }
            }

            if (colorClass) {
                const coloredNumber = `<span class="${colorClass}" style="font-weight: bold;">${match[0]}</span>`;
                cell.innerHTML = content.replace(match[0], coloredNumber);
            }
        });
    });
}


function checkStaleData() {
    compareDatasets();
}

