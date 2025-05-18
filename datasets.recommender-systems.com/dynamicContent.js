export class DynamicContent {
    static async loadContentAndFindElementById(htmlFileName, parentElementId) {
        const file = await fetch(htmlFileName);
        const element = document.getElementById(parentElementId);
        element.innerHTML = await file.text();
        return element;
    }

    static async loadContentToElement(htmlFileName, parentElement) {
        const file = await fetch(htmlFileName);
        parentElement.innerHTML = await file.text();
    }
}
