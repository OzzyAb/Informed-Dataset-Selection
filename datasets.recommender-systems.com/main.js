import { Loading } from './loading.js';
import { DynamicContent } from './dynamicContent.js';

var tabContentElement = null;

export const versionNumber = '1.0';

document.addEventListener('DOMContentLoaded', async () => {
  tabContentElement = document.getElementById('tabContent');
  await loadTab('./tabs/aps/aps.html');

  document.getElementById('aps-tab-btn').addEventListener('click', async (e) => {
    await loadTab('./tabs/aps/aps.html');
  });
  document.getElementById('compare-algo-btn').addEventListener('click', async (e) => {
    await loadTab('./tabs/compareAlgorithms/compareAlgorithms.html');
  });
  document.getElementById('compare-datasets-btn').addEventListener('click', async (e) => {
    await loadTab('./tabs/compareDatasets/compareDatasets.html');
  });

  const versionNumberElement = document.getElementById('version-number');
  versionNumberElement.textContent = 'Version ' + versionNumber;
});

var activeTabScript = null;
async function loadTab(fileName) {
  Loading.showLoading();

  if (activeTabScript !== null) {
    activeTabScript.dispose();
    activeTabScript = null;
  }
  
  await DynamicContent.loadContentToElement(fileName, tabContentElement);

  const jsFileName = fileName.split('.html')[0] + '.js';
  const script = await import(jsFileName);
  await script.initialize();

  activeTabScript = script;
  Loading.hideLoading();
}
