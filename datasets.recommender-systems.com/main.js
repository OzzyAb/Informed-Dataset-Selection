import { Loading } from "./loading.js";
import { DynamicContent } from "./dynamicContent.js";

var tabContentElement = null;

export const versionNumber = "1.0";

document.addEventListener("DOMContentLoaded", async () => {
  tabContentElement = document.getElementById("tabContent");

  const compareAlgorithmsBtn = document.getElementById("compare-algo-btn");
  const compareDatasetsBtn = document.getElementById("compare-datasets-btn");
  const apsTabBtn = document.getElementById("aps-tab-btn");

  apsTabBtn.addEventListener("click", async (e) => {
    await loadTab("./tabs/aps/aps.html");
  });
  compareAlgorithmsBtn.addEventListener("click", async (e) => {
    await loadTab("./tabs/compareAlgorithms/compareAlgorithms.html");
  });
  compareDatasetsBtn.addEventListener("click", async (e) => {
    await loadTab("./tabs/compareDatasets/compareDatasets.html");
  });

  const queryOptions = readQueryString(window.location.search);

  if (queryOptions.tab) {
    const tabName = queryOptions.tab;
    if (tabName === "compareAlgorithms") {
      compareAlgorithmsBtn.click();
    } else if (tabName === "compareDatasets") {
      compareDatasetsBtn.click();
    } else {
      apsTabBtn.click();
    }
  }

  const versionNumberElement = document.getElementById("version-number");
  versionNumberElement.textContent = "Version " + versionNumber;
});

var activeTabScript = null;
async function loadTab(fileName) {
  if (Loading.isLoading()) return;

  Loading.showLoading();

  if (activeTabScript !== null) {
    activeTabScript.dispose();
    activeTabScript = null;
  }

  await DynamicContent.loadContentToElement(fileName, tabContentElement);

  const jsFileName = fileName.split(".html")[0] + ".js";
  const script = await import(jsFileName);
  const queryOptions = readQueryString(window.location.search);
  await script.initialize(queryOptions);

  activeTabScript = script;
  Loading.hideLoading();
}

export function getQueryString(options) {
  const params = new URLSearchParams(options).toString();
  return window.location.href.split("?")[0] + "?" + params;
}
function readQueryString(queryString) {
  const params = new URLSearchParams(queryString);
  const options = Object.fromEntries(params.entries());
  return options;
}
