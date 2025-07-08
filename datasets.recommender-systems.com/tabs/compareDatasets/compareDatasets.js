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

let columnsWithInfo = {};


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
        meanNumberOfRatingsByUser: "Mean Interaction per User",
        meanNumberOfRatingsOnItem: "Mean Interaction per Item",
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
    { name: 'Mean Interactions per User', description: 'Mean Number of Ratings By User', info: 'mean-ratings-per-user-info', key: 'meanNumberOfRatingsByUser', fixed: 2, better: 'range', rangeDescription: [
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
    { name: 'Mean Interactions per Item', description: 'Mean Number of Ratings On Item', info: 'mean-ratings-per-item-info', key: 'meanNumberOfRatingsOnItem', fixed: 2, better: 'range', rangeDescription: [
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

    
    //document.body.appendChild(infoElements['user-item-ratio-info']);
    //document.body.appendChild(infoElements['mean-ratings-per-user-info']);
    //document.body.appendChild(infoElements['mean-ratings-per-item-info']);
    
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
    selectedColumns = [
        'name',
        'numberOfUsers',
        'numberOfItems',
        'numberOfInteractions',
        'userItemRatio',
        'density',
        'meanNumberOfRatingsByUser',
        'meanNumberOfRatingsOnItem'
    ];
    
    let initialSelectedDatasetIds;
    if (queryOptions && queryOptions.datasets) {
        initialSelectedDatasetIds = queryOptions.datasets.split(' ').map(id => Number(id));
    } else {
        initialSelectedDatasetIds = datasets.map(ds => ds.id);    
    }
    let initialSelectedColumnIds;

    if (queryOptions && queryOptions.columns) {
        initialSelectedColumnIds = queryOptions.columns.split(' ');
        selectedColumns = initialSelectedColumnIds;
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
    
     metadataElements.forEach(meta => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'column_' + meta.key;
        checkbox.value = meta.key;
        checkbox.checked = selectedColumns.includes(meta.key);
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
            
        });
    });

    columnsWithInfo = {
        userItemRatio: {
            modalId: 'user-item-ratio-modal',
            generator: () => generateUserItemRatioTooltip(datasets),
        },
        meanNumberOfRatingsByUser: {
            modalId: 'mean-ratings-per-user-modal',
            generator: () => generateMeanRatingsPerUserTooltip(datasets),
        },
        meanNumberOfRatingsOnItem: {
            modalId: 'mean-ratings-per-item-modal',
            generator: () => generateMeanRatingsPerItemTooltip(datasets),
        },
    };

    const theadRow = document.querySelector('#dataset-table thead tr');
    if (theadRow) {
        theadRow.addEventListener('click', (event) => {
            const btn = event.target.closest('button.tooltip-icon');
            if (!btn) return;

            event.stopPropagation();

            const modalId = btn.dataset.modalId;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                console.log("Modal geöffnet:", modalId);

                // NEU: Tooltip dynamisch erzeugen
                const key = btn.closest('th')?.dataset.key;
                if (columnsWithInfo[key]?.generator) {
                    columnsWithInfo[key].generator(); // Tooltip generieren
                }

            } else {
                console.warn("Modal nicht gefunden:", modalId);
            }
        });
    }

    document.querySelectorAll('.info-modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.info-modal-overlay');
            if (modal) modal.style.display = 'none';
        });
    });

    shareButton = document.getElementById("compare-database-share-btn");
    shareButton.addEventListener("click", shareDatabaseComparison);
    document.getElementById('dataset-export-csv-btn').addEventListener('click', exportDatasetTableCsv);
    currentSortKey = 'name';
    currentSortDirection = 'asc';
    compareDatasets();
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

// main function of the comparison

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
    // colorNumbersOnly(table);
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
    selectAllColumnsButtonText.textContent = 'Select All';

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
    renderTableHead();
    compareDatasets();
    updateSelectAllButtonText(selectedColumns.length,datasetColumnCheckboxes.length,selectAllColumnsButtonText);
    
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

//renders the table head of the dataset tab
function renderTableHead() {
    const theadRow = document.querySelector('#dataset-table thead tr');
    if (!theadRow) {
        console.error("thead tr konnte nicht gefunden werden.");
        return;
    }

    theadRow.innerHTML = '';

    columnsWithInfo = {
        userItemRatio: {
            modalId: 'user-item-ratio-modal',
            generator: () => generateUserItemRatioTooltip(datasets),
        },
        meanNumberOfRatingsByUser: {
            modalId: 'mean-ratings-per-user-modal',
            generator: () => generateMeanRatingsPerUserTooltip(datasets),
        },
        meanNumberOfRatingsOnItem: {
            modalId: 'mean-ratings-per-item-modal',
            generator: () => generateMeanRatingsPerItemTooltip(datasets),
        },
    };

    selectedColumns.forEach((key) => {
        const th = document.createElement('th');
        th.classList.add('sortable');
        th.style.cursor = 'pointer';
        th.dataset.key = key;

        const spanText = document.createElement('span');
        spanText.textContent = columnDisplayNames[key] || key;
        th.appendChild(spanText);

        if (columnsWithInfo[key]) {
            const infoIcon = document.createElement('button');
            infoIcon.classList.add('tooltip-icon');
            infoIcon.setAttribute('type', 'button');
            infoIcon.setAttribute('aria-label', 'Info');
            infoIcon.style.background = 'none';
            infoIcon.style.border = 'none';
            infoIcon.style.cursor = 'help';
            infoIcon.style.padding = '0';
            infoIcon.style.marginLeft = '5px';

            const iconElem = document.createElement('i');
            iconElem.className = 'fa-solid fa-circle-info';
            infoIcon.appendChild(iconElem);

            // Wichtig: Modal-ID als data-Attribut speichern
            infoIcon.dataset.modalId = columnsWithInfo[key].modalId;

            

            th.appendChild(infoIcon);
        }

        const sortIcon = document.createElement('span');
        sortIcon.classList.add('sort-icon');
        sortIcon.style.marginLeft = '6px';
        sortIcon.textContent = '⇵';
        th.appendChild(sortIcon);

        th.addEventListener('click', (event) => {
            if (event.target.closest('button.tooltip-icon')) {
                return; // Klick auf Info-Icon ignorieren für Sortierung
            }
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
    renderDatasetComparisonTable();
}



//renders the body of the dataset comparison table

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
}
 
// main function of the sorting 

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
            icon.textContent = '⇵'; 
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
            
        });
    });
}


function formatValue(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
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
  const columnIds = selectedColumns.map(col => typeof col === 'object' ? col.id : col);

    const options = {
    tab: "compareDatasets",
    datasets: datasetIds.join(" "),
    columns: columnIds.join(" ")
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


function exportDatasetTableCsv() {
    const exportBtn = document.getElementById('dataset-export-csv-btn');
    const icon = exportBtn.querySelector('i');
    const originalHTML = exportBtn.innerHTML;

    async function updateUI(text, duration = 2000) {
        exportBtn.innerHTML = '';
        exportBtn.appendChild(icon.cloneNode(true));
        exportBtn.appendChild(document.createTextNode(text));
        await new Promise(resolve => setTimeout(resolve, duration));
        exportBtn.innerHTML = originalHTML;
        exportBtn.disabled = false;
    }

    (async () => {
        try {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '';
            exportBtn.appendChild(icon.cloneNode(true));
            exportBtn.appendChild(document.createTextNode('Exporting...'));

            await new Promise(resolve => setTimeout(resolve, 100)); 

            const table = document.getElementById('dataset-table');
            const rows = Array.from(table.querySelectorAll('tr'));

            const csv = rows.map(row => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                return cells.map(cell => {
                    let text = cell.innerText || '';
                    text = text.trim();
                    text = text.replace(/"/g, '""'); 

                    
                    const isRiskyForExcel = /^(\d{1,2}[.,/-]\d{1,2})$/.test(text) || /^[0-9]+([.,][0-9]+)?$/.test(text);
                    if (isRiskyForExcel) {
                        return `="${text}"`;
                    }

                    return `"${text}"`;
                }).join(';');
            }).join('\n');
                

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-T:]/g, '');
            const filename = `dataset_export_${timestamp}.csv`;

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            await updateUI('Exported!', 2000);

        } catch (error) {
            console.error('CSV export error:', error);
            await updateUI('Export Failed', 3000);
        }
    })();
}



// This function creates the tooltip for the user-item ratio column, which can be opened by clicking the info icon

function generateUserItemRatioTooltip(datasets) {
    const ratios = datasets
        .map(d => d.meanNumberOfRatingsByUser)
        .filter(r => typeof r === 'number' && !isNaN(r));

    if (ratios.length === 0) return;

    const modal = document.getElementById('user-item-ratio-modal');
    const body = document.getElementById('user-item-ratio-modal-body');
    if (!modal || !body) return;

    body.innerHTML = ''; // clear previous content

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `font-size: 0.85rem; color: #333;`;

    const explanationText = `
        The user-item ratio is an indicator for evaluating the balance of the interaction matrix. An extreme imbalance
        hinders the model's capacity to learn robust collaborative patterns. In contrast, a more moderate ratio helps adequate
        interaction overlap between users and items. Therefore, a moderate user-item ratio improves the effectiveness of
        co-embedding representations. This subsequently helps you to reduce the issues of data sparsity and the risk of
        overfitting to popular users or items.
    `;

    const explanation = document.createElement('div');
    explanation.innerHTML = `<p>${explanationText}</p>`;
    explanation.style.cssText = `
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    `;
    wrapper.appendChild(explanation);

    const disclaimer = document.createElement('div');
    disclaimer.className = 'difficulty-disclaimer';
    disclaimer.style.cssText = `
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 0.375rem;
        color: #856404;
    `;
    disclaimer.innerHTML = `
        <strong>Important note:</strong> The displayed ranges are computed using a quantile-based statistical distribution.
    `;
    wrapper.appendChild(disclaimer);

    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
    `;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Ratio', 'Description', 'Risk Level', 'Cause', 'Bias Risk', 'Cold-Start Risk'].forEach(title => {
        const th = document.createElement('th');
        th.textContent = title;
        th.style = 'border: 1px solid #ccc; padding: 6px; background: #e9ecef;';
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const levels = [
        { description: 'Extremely item-heavy', risk: 'High', cause: 'Too many items with too few users', bias: 'Strong long-tail bias', coldStart: 'High (items)' },
        { description: 'Very item-heavy', risk: 'Medium', cause: 'Items start getting ignored', bias: 'Long-tail bias', coldStart: 'Medium (items)' },
        { description: 'Slightly item-heavy', risk: 'Low', cause: 'Good coverage of items and users', bias: 'Low', coldStart: 'Low' },
        { description: 'Balanced', risk: 'Low', cause: 'Optimal learning conditions', bias: 'Minimal', coldStart: 'Low' },
        { description: 'Slightly user-heavy', risk: 'Medium', cause: 'Fewer items, users converge on same content', bias: 'Popularity bias', coldStart: 'Medium (users)' },
        { description: 'Very user-heavy', risk: 'High', cause: 'Too few items for many users', bias: 'Heavy popularity bias', coldStart: 'High (users)' },
        { description: 'Extremely user-heavy', risk: 'High', cause: 'Severe lack of items', bias: 'Strong popularity bias', coldStart: 'High (users)' }
    ];

    const ranges = createQuantileRanges(ratios, levels);

    const tbody = document.createElement('tbody');
    ranges.forEach(r => {
        const row = document.createElement('tr');
        [
            r.label,
            r.description,
            r.risk,
            r.cause,
            r.bias,
            r.coldStart
        ].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            td.style = 'border: 1px solid #ccc; padding: 6px;';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    body.appendChild(wrapper);

    modal.style.display = 'flex';

    modal.querySelector('.info-modal-close').onclick = () => {
        modal.style.display = 'none';
    };

    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// This function creates the tooltip for the mean interaction per user column, which can be opened by clicking the info icon
function generateMeanRatingsPerUserTooltip(datasets) {
    const ratios = datasets
        .map(d => d.userItemRatio)
        .filter(r => typeof r === 'number' && !isNaN(r));

    if (ratios.length === 0) return;

    const modal = document.getElementById('mean-ratings-per-user-modal');
    const body = document.getElementById('mean-ratings-per-user-modal-body');
    if (!modal || !body) return;

    body.innerHTML = ''; // clear previous content

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `font-size: 0.85rem; color: #333;`;

    const explanationText = `
        A sufficient volume of user interactions is essential for learning reliable preference patterns in collaborative
        filtering (CF) systems. However, an excessive concentration of interactions among a small subset of highly active users
        can introduce activity bias, leading the model to overfit to these users and compromising its generalizability.
        Optimal performance is typically achieved when users contribute enough interactions to show consistent behavioral patterns
        without dominating the training of your model.
    `;

    const explanation = document.createElement('div');
    explanation.innerHTML = `<p>${explanationText}</p>`;
    explanation.style.cssText = `
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    `;
    wrapper.appendChild(explanation);

    const disclaimer = document.createElement('div');
    disclaimer.className = 'difficulty-disclaimer';
    disclaimer.style.cssText = `
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 0.375rem;
        color: #856404;
    `;
    disclaimer.innerHTML = `
        <strong>Important note:</strong> The displayed ranges are computed using a quantile-based statistical distribution.
    `;
    wrapper.appendChild(disclaimer);

    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
    `;
    

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Range', 'Risk Level', 'Cause', 'Bias Risk', 'Cold-Start Risk'].forEach(title => {
        const th = document.createElement('th');
        th.textContent = title;
        th.style = 'border: 1px solid #ccc; padding: 6px; background: #e9ecef;';
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const levels = [
        { risk: 'High', cause: 'Users do not interact enough to learn preferences', bias: 'Strong long-tail bias', coldStart: 'High (users)' },
        { risk: 'Medium', cause: 'Sparse signals', bias: 'Slight popularity bias', coldStart: 'Medium (users)' },
        { risk: 'Low', cause: 'Balanced', bias: 'Low', coldStart: 'Low' },
        { risk: 'Medium', cause: 'Power users dominate, skewed model', bias: 'Activity bias', coldStart: 'Low' },
        { risk: 'High', cause: 'Overfitting to active users', bias: 'User bias', coldStart: 'High' },
    ];

    const ranges = createQuantileRanges(ratios, levels);

    const tbody = document.createElement('tbody');
    ranges.forEach(r => {
        const row = document.createElement('tr');
        [r.label, r.risk, r.cause, r.bias, r.coldStart].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            td.style = 'border: 1px solid #ccc; padding: 6px;';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    body.appendChild(wrapper);

    modal.style.display = 'flex'; 

    // Close modal logic
    modal.querySelector('.info-modal-close').onclick = () => {
        modal.style.display = 'none';
    };

    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// This function creates the tooltip for the mean interactions per item column, which can be opened by clicking the info icon

function generateMeanRatingsPerItemTooltip(datasets) {

    console.log("Modal:", document.getElementById('mean-ratings-per-item-modal'));
    console.log("Modal Body:", document.getElementById('mean-ratings-per-item-modal-body'));
    const values = datasets
        .map(d => d.meanNumberOfRatingsOnItem)
        .filter(v => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return;

    const modal = document.getElementById('mean-ratings-per-item-modal');
    const body = document.getElementById('mean-ratings-per-item-modal-body');
    body.innerHTML = ''; 

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `font-size: 0.85rem; color: #333;`;

    const explanation = document.createElement('div');
    explanation.innerHTML = `
        <p>
            Balanced item exposure is crucial for learning robust item representations in recommender systems. Items with sparse
            interactions tend to be underrepresented in the learned latent space, which results in poor generalization and increase in
            the cold-start problem. In contrast, items with high interactions can dominate the representation space and can lead
            to popularity bias. Maintaining a moderate and well-distributed range of item interactions helps the training of your model
            across the item catalog and improves the recommendation diversity.
        </p>
    `;
    explanation.style.cssText = `
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    `;
    wrapper.appendChild(explanation);

    const disclaimer = document.createElement('div');
    disclaimer.className = 'difficulty-disclaimer';
    disclaimer.style.cssText = `
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 0.375rem;
        color: #856404;
    `;
    disclaimer.innerHTML = `
        <strong>Important note:</strong> The displayed ranges are computed using a quantile-based statistical distribution.
    `;
    wrapper.appendChild(disclaimer);

    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
    `;
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Range', 'Risk Level', 'Cause', 'Bias Risk', 'Cold-Start Risk'].forEach(title => {
        const th = document.createElement('th');
        th.textContent = title;
        th.style = 'border: 1px solid #ccc; padding: 6px; background: #e9ecef;';
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const levels = [
        { risk: 'High', cause: 'Items too underexposed', bias: 'Long-tail bias', coldStart: 'High (items)' },
        { risk: 'Medium', cause: 'Weak signals for most items', bias: 'Slight popularity bias', coldStart: 'Medium' },
        { risk: 'Low', cause: 'Balanced', bias: 'Low', coldStart: 'Low' },
        { risk: 'Medium', cause: 'Few dominant items', bias: 'Popularity bias', coldStart: 'Low' },
        { risk: 'High', cause: 'Head dominates, tail ignored', bias: 'Strong popularity bias', coldStart: 'High' },
    ];

    const ranges = createQuantileRanges(values, levels);
    const tbody = document.createElement('tbody');

    ranges.forEach(r => {
        const row = document.createElement('tr');
        [r.label, r.risk, r.cause, r.bias, r.coldStart].forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            td.style = 'border: 1px solid #ccc; padding: 6px;';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    body.appendChild(wrapper);

    // Show modal
    modal.style.display = 'flex';

    // Add close handler
    modal.querySelector('.info-modal-close').onclick = () => {
        modal.style.display = 'none';
    };
}

// This function creates the statistical model for the ranges of the info icons in the dataset-tab
function createQuantileRanges(values, levels) {
    const sorted = [...values].sort((a, b) => a - b);

    const quantile = (q) => {
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        return sorted[base + 1] !== undefined
            ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
            : sorted[base];
    };

    const count = levels.length;
    const thresholds = [];
    for (let i = 1; i < count; i++) {
        thresholds.push(quantile(i / count));
    }

    const ranges = [];
    for (let i = 0; i < count; i++) {
        const min = i === 0 ? -Infinity : thresholds[i - 1];
        const max = i === count - 1 ? Infinity : thresholds[i];

        const label = i === 0
            ? `< ${max.toFixed(2)}`
            : i === count - 1
            ? `> ${min.toFixed(2)}`
            : `${min.toFixed(2)} - ${max.toFixed(2)}`;

        ranges.push({
            label,
            ...levels[i]
        });
    }

    return ranges;
}



