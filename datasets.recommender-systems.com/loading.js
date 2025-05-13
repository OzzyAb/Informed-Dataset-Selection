var loadingContainer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadingContainer = document.getElementById('loadingContainer');
});

class Loading {
    static showLoading() {
        loadingContainer.className = 'loading';
    }
    
    static hideLoading() {
        loadingContainer.className = 'loaded';
    }
}
