// Reusable Search Component
class SearchBar extends HTMLElement {
    connectedCallback() {
        const placeholder = this.getAttribute('placeholder') || 'Search posts...';
        const targetSelector = this.getAttribute('target') || '.article';
        const guestLocked = this.isGuestLocked();
        const resolvedPlaceholder = guestLocked ? 'Login to use search' : placeholder;
        
        this.innerHTML = `
            <div class="search-wrapper">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="${resolvedPlaceholder}"
                    ${guestLocked ? 'readonly aria-disabled="true" data-guest-locked="1"' : ''}
                />
            </div>
        `;

        if (guestLocked) {
            this.setAttribute('data-guest-locked', '1');
        } else {
            this.removeAttribute('data-guest-locked');
        }
        
        this.attachListeners(targetSelector);
    }

    isGuestLocked() {
        if (this.getAttribute('guest-lock') === 'false') return false;
        return !(localStorage.getItem('currentUserId') || '').trim();
    }

    showGuestMessage() {
        if (typeof AlertModal !== 'undefined' && typeof AlertModal.show === 'function') {
            AlertModal.show('Please login or sign up to use search.', 'error');
        }
    }
    
    attachListeners(targetSelector) {
        const input = this.querySelector('.search-input');
        
        if (input) {
            if (this.isGuestLocked()) {
                const blockGuestSearch = (event) => {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    input.blur();
                    this.showGuestMessage();
                };

                input.addEventListener('focus', blockGuestSearch);
                input.addEventListener('click', blockGuestSearch);
                input.addEventListener('keydown', blockGuestSearch);
                input.addEventListener('beforeinput', blockGuestSearch);
                input.addEventListener('paste', blockGuestSearch);
                return;
            }

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
