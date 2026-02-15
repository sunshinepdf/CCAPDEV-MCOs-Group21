// Reusable Search Component
class SearchBar extends HTMLElement {
    connectedCallback() {
        const placeholder = this.getAttribute('placeholder') || 'Search posts...';
        const targetSelector = this.getAttribute('target') || '.article';
        
        this.innerHTML = `
            <div class="search-wrapper">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="${placeholder}"
                />
            </div>
        `;
        
        this.attachListeners(targetSelector);
    }
    
    attachListeners(targetSelector) {
        const input = this.querySelector('.search-input');
        
        if (input) {
            input.addEventListener('keyup', () => {
                this.filterPosts(targetSelector);
                // Trigger global filter function if exists (for category coordination)
                if (typeof window.filterPostsWithCategories === 'function') {
                    window.filterPostsWithCategories();
                } else {
                    this.filterPosts(targetSelector);
                }
            });
            
            input.addEventListener('input', () => {
                if (typeof window.filterPostsWithCategories === 'function') {
                    window.filterPostsWithCategories();
                } else {
                    this.filterPosts(targetSelector);
                }
            });
        }
    }
    
    normalizeText(text) {
        return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    
    filterPosts(targetSelector) {
        const input = this.querySelector('.search-input');
        const rawInput = input?.value || "";
        const searchInput = this.normalizeText(rawInput);
        
        const posts = document.querySelectorAll(targetSelector);
        
        posts.forEach(post => {
            // Check if target is a wrapper (like profile-post-wrapper)
            const article = post.classList.contains('article') ? post : post.querySelector('.article');
            
            if (article) {
                const title = this.normalizeText(article.querySelector(".headline")?.innerText || "");
                const content = this.normalizeText(article.querySelector(".excerpt")?.innerText || "");
                
                const matchesSearch = searchInput === "" || title.includes(searchInput) || content.includes(searchInput);
                
                // Apply to the wrapper or the article itself
                post.style.display = matchesSearch ? "block" : "none";
            } else {
                // If no article found, apply normal filtering
                const title = this.normalizeText(post.querySelector(".headline")?.innerText || "");
                const content = this.normalizeText(post.querySelector(".excerpt")?.innerText || "");
                
                const matchesSearch = searchInput === "" || title.includes(searchInput) || content.includes(searchInput);
                
                post.style.display = matchesSearch ? "block" : "none";
            }
        });
    }
    
    // Public method to get current search value
    getValue() {
        const input = this.querySelector('.search-input');
        return input?.value || "";
    }
    
    // Public method to clear search
    clear() {
        const input = this.querySelector('.search-input');
        if (input) {
            input.value = "";
            this.filterPosts(this.getAttribute('target') || '.article');
        }
    }
}

customElements.define("search-bar", SearchBar);
