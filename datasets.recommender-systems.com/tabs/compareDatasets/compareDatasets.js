import { ApiService } from "../../apiService.js";
import { capitalizeFirstLetter } from "../../util.js";
import { readQueryString, getQueryString, clearQueryString } from "../../main.js";

var datasets = null;
var selectedDatasets = [];
var selectedColumns = [];

var tableBodyElement = null;
var tableHeadElement = null;

let currentSortKey = null;
let currentSortDirection = 'asc'; // 'asc' oder 'desc'
var infoElements = {};

var datasetFilterHeaderElement = null;
var datasetFilterArea = null;
var datasetFilterCheckboxes = [];

var datasetColumnHeaderElement = null;
var datasetColumnArea = null;
var datasetColumnCheckboxes = [];

var selectAllDatasetArea = null;
var selectAllDatasetButton = null;
var selectAllDatasetButtonText = null;

var selectAllColumnsArea = null;
var selectAllColumnsButton = null;
var selectAllColumnsButtonText = null;

var shareButton = null;

const columnDisplayNames = {
        name: "Dataset",
        numberOfUsers: "Number of Users",
        numberOfItems: "Number of Items",
        numberOfInteractions: "Number of Interactions",
        userItemRatio: "User-Item Ratio",
        density: "Density",
        feedbackType: "Feedback Type",
        highestNumberOfRatingBySingleUser: "Max Rating/User",
        lowestNumberOfRatingBySingleUser: "Min Rating/User",
        highestNumberOfRatingOnSingleItem: "Max Rating/Item",
        lowestNumberOfRatingOnSingleItem: "Min Rating/Item",
        meanNumberOfRatingsByUser: "Mean Ratings/User",
        meanNumberOfRatingsOnItem: "Mean Ratings/Item",
    };

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
    { name: 'Feedback Type', key: 'feedbackType' },
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

export async function initialize(queryOptions) {

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

    datasetColumnHeaderElement = document.getElementById('dataset-column-header');
    datasetColumnArea = document.getElementById('dataset-column-filter');

    datasetFilterArea.innerHTML = '';
    datasetFilterArea.appendChild(selectAllDatasetArea);

    datasetFilterCheckboxes = [];
    selectedDatasets = [];

    let initialSelectedDatasetIds;
    if (queryOptions && queryOptions.datasets) {
        initialSelectedDatasetIds = queryOptions.datasets.split(' ').map(id => Number(id));
    } else {
        initialSelectedDatasetIds = datasets.map(ds => ds.id);
    }

    datasets.forEach(dataset => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = dataset.id;
        checkbox.name = 'datasetCheckbox';
        checkbox.value = dataset.name;
        
        checkbox.checked = initialSelectedDatasetIds.includes(dataset.id);
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

        
        if (checkbox.checked) {
            selectedDatasets.push(dataset.id);
        }
    });

    datasetColumnArea.innerHTML = '';
    datasetColumnArea.appendChild(selectAllColumnsArea); 

    
    datasetColumnCheckboxes = [];
    selectedColumns = metadataElements.map(el => el.key);

    metadataElements.forEach(meta => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'column_' + meta.key;
        checkbox.value = meta.key;
        checkbox.checked = true;
        checkbox.onchange = onFilterColumn;

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = meta.name;
        label.style.marginRight = '10px';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '6px';
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        datasetColumnCheckboxes.push(checkbox);
        datasetColumnArea.appendChild(wrapper);
    });


    updateColumnHeaderLabel();

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

    shareButton = document.getElementById("compare-database-share-btn");
    shareButton.addEventListener("click", shareDatabaseComparison);
    currentSortKey = 'name';
    currentSortDirection = 'asc';
    compareDatasets();
    initializeTooltips();
    updateFilterHeader(
        selectedDatasets.length,
        datasetFilterCheckboxes.length,
        datasetFilterHeaderElement,
        selectedDatasets,
        datasets,
        'name'
    );
    updateFilterHeader(
        selectedColumns.length,
        datasetColumnCheckboxes.length,
        datasetColumnHeaderElement,
        selectedColumns,
        metadataElements,
        'name'
    );
}

async function onFilterDataset(e) {
    const datasetId = Number(e.target.id);
    if (e.target.checked) {
        selectedDatasets.push(datasetId);
    }
    else {
        const index = selectedDatasets.indexOf(datasetId);
        selectedDatasets.splice(index, 1);
    }

        updateFilterHeader(
        selectedDatasets.length,
        datasetFilterCheckboxes.length,
        datasetFilterHeaderElement,
        selectedDatasets,
        datasets,
        'name'
    )
    updateSelectAllButtonText(selectedDatasets.length,datasetFilterCheckboxes.length,selectAllDatasetButtonText);;

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
    renderTableHead();
    bindSortEvents();
    selectedDatasets.forEach(dataset => {
        const tr = document.createElement('tr');

        const cells = metadataElements
            .filter(meta => selectedColumns.includes(meta.key))
            .map(meta => {
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
    // Dataset filter select button

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

    //Column select button

    selectAllColumnsArea = document.createElement('div');
    selectAllColumnsArea.style.width = '100%';

    selectAllColumnsButton = document.createElement('button');
    selectAllColumnsButton.type = 'button';
    selectAllColumnsButton.className = 'filter-control-btn';
    selectAllColumnsButton.addEventListener('click', toggleAllColumns);

    icon = document.createElement('i');
    icon.className = 'fa-solid fa-filter';
    icon.style.setProperty('color', 'white', 'important');
    icon.style.marginRight = '0.3rem';

    selectAllColumnsButtonText = document.createElement('span');
    selectAllColumnsButtonText.textContent = 'Deselect All';

    selectAllColumnsButton.appendChild(icon);
    selectAllColumnsButton.appendChild(selectAllColumnsButtonText);
    selectAllColumnsArea.appendChild(selectAllColumnsButton);
}

function toggleAllDatasets() {
    const checkedCount = selectedDatasets.length;
    const shouldCheck = checkedCount !== datasetFilterCheckboxes.length;

    datasetFilterCheckboxes.forEach(checkbox => {
        checkbox.checked = shouldCheck;
    });

    selectedDatasets = shouldCheck ? datasets.map(dataset => dataset.id) : [];

    updateFilterHeader(selectedDatasets.length, datasetFilterCheckboxes.length,datasetFilterHeaderElement,selectedDatasets,datasets,'name');
    updateSelectAllButtonText(selectedDatasets.length,datasetFilterCheckboxes.length,selectAllDatasetButtonText);
    compareDatasets()
}

function toggleAllColumns() {
    const checkedCount = selectedColumns.length;
    const shouldCheck = checkedCount !== datasetColumnCheckboxes.length;

    datasetColumnCheckboxes.forEach(checkbox => {
        checkbox.checked = shouldCheck;
    });

    selectedColumns = shouldCheck
        ? metadataElements.map(col => col.key)
        : [];

    updateFilterHeader(selectedColumns.length,datasetColumnCheckboxes.length,datasetColumnHeaderElement,selectedColumns,'name');
    updateSelectAllButtonText(selectedColumns.length,datasetColumnCheckboxes.length,selectAllColumnsButtonText);
    compareDatasets()
}


function updateFilterHeader(checkedCount, totalCount, headerElement, selectedItems, allItems, keyName) {
    if (checkedCount === totalCount) {
        headerElement.innerText = '(All selected)';
    } else if (checkedCount === 0) {
        headerElement.innerText = '(None selected)';
    } else if (checkedCount === 1) {
        const selectedId = selectedItems[0];
        const selectedItem = allItems.find(item => item.id === selectedId);
        headerElement.innerText = `(${selectedItem[keyName]})`;
    } else {
        headerElement.innerText = `(${checkedCount} selected)`;
    }
}

function updateSelectAllButtonText(checkedCount, totalCount, buttonTextElement) {
    if (checkedCount === totalCount) {
        buttonTextElement.textContent = 'Deselect All';
    } else {
        buttonTextElement.textContent = 'Select All';
    }
}


function onFilterColumn() {
    selectedColumns = datasetColumnCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    updateColumnHeaderLabel();
    renderDatasetComparisonTable();
    renderTableHead()
    compareDatasets()
}

function updateColumnHeaderLabel() {
    if (selectedColumns.length === metadataElements.length) {
        datasetColumnHeaderElement.textContent = '(All selected)';
    } else if (selectedColumns.length === 0) {
        datasetColumnHeaderElement.textContent = '(None selected)';
    } else {
        datasetColumnHeaderElement.textContent = `(${selectedColumns.length} selected)`;
    }
}

function renderTableHead() {
    const theadRow = document.querySelector('#dataset-table thead tr');
    if (!theadRow) {
        console.error("thead tr konnte nicht gefunden werden.");
        return;
    }

    theadRow.innerHTML = '';

    selectedColumns.forEach((key) => {
        const th = document.createElement('th');
        th.classList.add('sortable');
        th.dataset.key = key;

        const spanText = document.createElement('span');
        spanText.textContent = columnDisplayNames[key] || key;
        th.appendChild(spanText);

        const sortIcon = document.createElement('span');
        sortIcon.classList.add('sort-icon');
        th.appendChild(sortIcon);

        th.addEventListener('click', () => {
            if (currentSortKey === key) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = key;
                currentSortDirection = 'asc';
            }
            renderTableHead(); 
            renderDatasetComparisonTable(); 
        });

        theadRow.appendChild(th);
    });

    updateSortIcons(); 
}


function renderDatasetComparisonTable() {
    if (!Array.isArray(datasets) || datasets.length === 0) {
        console.warn("Keine datasets geladen.");
        return;
    }

    if (!selectedDatasets || selectedDatasets.length === 0) {
        console.warn("Keine Datensätze ausgewählt.");
        return;
    }

    const tableBodyElement = document.querySelector('#dataset-table tbody');

    if (!tableBodyElement) {
        console.error("tbody konnte nicht gefunden werden.");
        return;
    }

    
    tableBodyElement.innerHTML = '';

    const filteredDatasets = datasets.filter(ds => selectedDatasets.includes(ds.id));

    const sortedDatasets = filteredDatasets.sort((a, b) => {
        const aValue = a[currentSortKey];
        const bValue = b[currentSortKey];

        if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    
    const createCell = (value) => {
        const td = document.createElement('td');
        td.textContent = value !== undefined && value !== null ? value : '-';
        return td;
    };

    
    for (const dataset of sortedDatasets) {
        const row = document.createElement('tr');

        selectedColumns.forEach(key => {
            const value = dataset[key];
            row.appendChild(createCell(value));
        });

        tableBodyElement.appendChild(row);
    }

    if (typeof initializeTooltips === 'function') {
        initializeTooltips();
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
        const icon = th.querySelector('.sort-icon');
        const key = th.dataset.key;  
        if (!icon || !key) return;

        if (key === currentSortKey) {
            icon.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
        } else {
            icon.textContent = '';
        }
    });
}

function bindSortEvents() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const newTh = th.cloneNode(true); 
        th.parentNode.replaceChild(newTh, th); 

        newTh.addEventListener('click', () => {
            const key = newTh.getAttribute('data-key');

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

function shareDatabaseComparison() {
  const datasetIds = selectedDatasets.map(ds => typeof ds === 'object' ? ds.id : ds);

  const options = {
    tab: "compareDatasets",
    datasets: datasetIds.join(" "), 
  };

  const url = getQueryString(options);

  navigator.clipboard
    .writeText(url)
    .then(() => {
      const shareBtn = document.getElementById("compare-database-share-btn");
      shareBtn.textContent = "Copied!";
      setTimeout(() => {
        shareBtn.innerHTML = '<i class="fa-solid fa-link"></i> Share';
      }, 2000);
    })
    .catch(() => {
      const shareBtn = document.getElementById("compare-database-share-btn");
      shareBtn.textContent = "Failed to copy";
      setTimeout(() => {
        shareBtn.innerHTML = '<i class="fa-solid fa-link"></i> Share';
      }, 2000);
    });
}


function checkStaleData() {
    compareDatasets();
}

