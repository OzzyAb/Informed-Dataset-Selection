var loadingContainer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadingContainer = document.getElementById('loadingContainer');
});

export class Loading {
    static #isLoading = false;

    static showLoading() {
        this.#isLoading = true;
        loadingContainer.className = 'loading';
    }
    
    static hideLoading() {
        loadingContainer.className = 'loaded';
        this.#isLoading = false;
    }

    static isLoading() {
        return this.#isLoading;
    }
}
