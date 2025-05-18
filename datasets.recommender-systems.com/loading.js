var loadingContainer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadingContainer = document.getElementById('loadingContainer');
});

export class Loading {
    static #isLoading = false;

    static showLoading() {
        this.#isLoading = true;
        loadingContainer.style.display = 'flex';
        loadingContainer.className = 'loading';
    }
    
    static hideLoading() {
        loadingContainer.style.display = 'none';
        loadingContainer.className = 'loaded';
        this.#isLoading = false;
    }

    static isLoading() {
        return this.#isLoading;
    }
}
