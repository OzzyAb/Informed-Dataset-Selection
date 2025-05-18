var tabContentElement = null;

var verisonNumber = '1.0';

document.addEventListener('DOMContentLoaded', async () => {
  tabContentElement = document.getElementById('tabContent');
  await loadTab('./tabs/aps/aps.html');

  const versionNumberElement = document.getElementById('version-number');
  versionNumberElement.textContent = 'Version ' + verisonNumber;
});

var activeTabScript = null;
async function loadTab(fileName) {
  Loading.showLoading();

  if (activeTabScript !== null) {
    activeTabScript.parentNode.removeChild(activeTabScript);
    activeTabScript.onload = null;
    activeTabScript = null;
  }
  
  await DynamicContent.loadContentToElement(fileName, tabContentElement);

  // Load the JS file related to the loaded tab
  const jsFileName = fileName.split('.html')[0] + '.js';
  const script = document.createElement('script');
  script.onload = async () => {
    await initialize();
    Loading.hideLoading();
  }
  script.src = jsFileName;
  script.id = jsFileName;
  document.head.appendChild(script);

  activeTabScript = script;
}
