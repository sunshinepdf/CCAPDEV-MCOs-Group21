class ProfileTopbar extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML =
            '<div class="profile-topbar" id="profile-topbar">' +
            '<div class="profile-title" id="profile-title">' +
            '<img src="assets/profile-icon.png" alt="profile" width="20" height="20">' +
            '<h1 class="poppins-extrabold">Profile Page</h1>' +
            '</div>' +
            '<search-bar placeholder="Find previous posts..." target=".profile-post-wrapper"></search-bar>' +
            '</div>';
    }
}

class ProfileSidebar extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML =
            '<aside class="profile-sidebar" id="profile-sidebar">' +
            '<div class="sidebar-card card" id="profile-user-info">' +
            '<h3 class="poppins-extrabold card__title">User Info</h3>' +
            '<div class="sidebar-stats poppins-regular">' +
            '<div class="stat-row"><span class="badge-pill poppins-extrabold">Pronouns:</span><span class="stat-value" id="profile-pronouns">They/them</span></div>' +
            '<div class="stat-row"><span class="badge-pill poppins-extrabold">Year:</span><span class="stat-value" id="profile-year">2nd Year</span></div>' +
            '<div class="stat-row"><span class="badge-pill poppins-extrabold">Major:</span><span class="stat-value" id="profile-major" style="color: #504e76;">Software Technology</span></div>' +
            '</div>' +
            '</div>' +
            '<div class="sidebar-card card" id="profile-stats">' +
            '<h3 class="poppins-extrabold card__title">Stats</h3>' +
            '<div class="sidebar-stats poppins-regular">' +
            '<div class="stat-row"><span class="stat-label">Posts</span><span class="stat-value" id="stats-posts">24</span></div>' +
            '<div class="stat-row"><span class="stat-label">Reputation</span><span class="stat-value" id="stats-reputation">89</span></div>' +
            '</div>' +
            '</div>' +
            '</aside>';
    }
}

class ProfileMain extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        // Check if viewing own profile
        const isOwnProfile = typeof window.isViewingOwnProfile === 'function' ? window.isViewingOwnProfile() : true;
        const editButtonHTML = isOwnProfile ? '<button class="btn-edit-profile poppins-extrabold" id="edit-profile-button" onclick="window.location.href=\'/edit-profile\'">Edit Profile</button>' : '';
        
        this.innerHTML =
            '<div class="profile-main" id="profile-main">' +
            '<div class="user-profile-header" id="profile-header">' +
            '<div class="profile-avatar" id="profile-avatar">' +
            '<img src="assets/placeholder.png" alt="Profile photo" id="profile-avatar-img">' +
            '</div>' +
            '<div class="profile-info">' +
            editButtonHTML +
            '<div class="profile-content" id="profile-content">' +
            '<h2 class="poppins-extrabold" id="profile-name">Username</h2>' +
            '<h4 class="poppins-extrabold-italic" id="profile-about-title">About Me</h4>' +
            '<p class="poppins-regular" id="profile-bio">This is a sample bio for the user profile. You can edit this bio to share more about yourself, your interests, and anything else you\'d like others to know! Feel free to make it as long or as short as you\'d like.</p>' +
            '<div class="profile-tags" id="profile-tags">' +
            '<div class="profile-tag" id="profile-tag-1">' +
            '<img src="assets/college-icon.png" alt="College" width="16" height="16">' +
            '<span class="poppins-extrabold">CCS</span>' +
            '</div>' +
            '<div class="profile-tag" id="profile-tag-2">' +
            '<img src="assets/batch-icon.png" alt="Batch" width="16" height="16">' +
            '<span class="poppins-extrabold">ID 124</span>' +
            '</div>' +
            '<div class="profile-tag" id="profile-tag-3">' +
            '<span class="poppins-extrabold">Friendly</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }
}

class ProfilePosts extends HTMLElement {
    connectedCallback() {
        this.render();
        this.attachListeners();
    }

    render() {
        const viewedUserId = typeof window.getViewedUserId === 'function' ? window.getViewedUserId() : ((localStorage.getItem('currentUserId') || '').trim());
        const isOwnProfile = typeof window.isViewingOwnProfile === 'function' ? window.isViewingOwnProfile() : true;
        const db = typeof PostsComponent_Instance !== 'undefined' ? PostsComponent_Instance.getDatabase() : null;
        
        let userPosts = [];
        if (db && db.posts) {
            userPosts = db.posts.filter(post => post.authorId === viewedUserId);
        }

        let postsHTML = '<section class="profile-posts-section" id="profile-posts-section">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">' +
            '<h1 class="poppins-extrabold" style="color: #fdf8e2; margin: 0;">User Posts</h1>';
        
        postsHTML += '</div><div class="profile-posts" id="profile-posts-list">';

        if (userPosts.length === 0) {
            postsHTML += '<p class="poppins-regular" style="text-align: center; padding: 20px; color: #fdf8e2;">No posts yet</p>';
        }

        this.innerHTML = postsHTML + '</div></section>';
        
        // Use PostsComponent to render posts as newspaper articles
        if (userPosts.length > 0) {
            const postsList = this.querySelector('#profile-posts-list');
            userPosts.forEach((post, index) => {
                // Create wrapper div for profile post styling
                const wrapper = document.createElement('div');
                wrapper.className = 'profile-post-wrapper';
                wrapper.setAttribute('data-id', post.id);
                
                // Render as newspaper article
                const articleElement = PostsComponent_Instance.buildNewspaperArticle(post, index, false);
                
                // Add three-dot menu for edit/delete only if viewing own profile
                if (isOwnProfile) {
                    const menuHTML = document.createElement('div');
                    menuHTML.className = 'owner-action-menu owner-action-menu--profile-post';
                    menuHTML.innerHTML = 
                        '<button class="owner-action-trigger" data-id="' + post.id + '" aria-label="Post actions">&#8942;</button>' +
                        '<div class="owner-action-dropdown" data-id="' + post.id + '" style="display: none;">' +
                            '<button class="owner-action-item post-edit-btn" data-id="' + post.id + '">Edit</button>' +
                            '<button class="owner-action-item owner-action-item-delete post-delete-btn" data-id="' + post.id + '">Delete</button>' +
                        '</div>';
                    
                    // Insert menu into article at the top
                    const authorHeader = articleElement.querySelector('.post-author-header');
                    if (authorHeader) {
                        authorHeader.appendChild(menuHTML);
                    }
                }
                
                wrapper.appendChild(articleElement);
                postsList.appendChild(wrapper);
            });
        }
    }

    attachListeners() {
        const self = this;

        if (!this._postActionsBound) {
            this.addEventListener('click', (e) => {
                // Ignore menu/edit/delete clicks handled below
                if (e.target.closest('.owner-action-menu') || e.target.closest('.owner-action-item')) {
                    return;
                }

                if (typeof PostsComponent_Instance === 'undefined') return;

                const handled = PostsComponent_Instance.handlePostAction(e, {
                    onVote: () => {
                        self.render();
                        self.attachListeners();
                        if (typeof window.updateProfileStats === 'function') {
                            window.updateProfileStats();
                        }
                    }
                });

                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            this._postActionsBound = true;
        }
        
        // Menu button handlers
        this.querySelectorAll('.owner-action-trigger[data-id]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const postId = btn.getAttribute('data-id');
                const dropdown = this.querySelector('.owner-action-dropdown[data-id="' + postId + '"]');
                
                // Close all other dropdowns
                this.querySelectorAll('.owner-action-dropdown').forEach(dd => {
                    if (dd !== dropdown) {
                        dd.style.display = 'none';
                    }
                });
                
                // Toggle current dropdown
                if (dropdown) {
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
            };
        });
        
        // Edit button handlers
        this.querySelectorAll('.post-edit-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const postId = btn.getAttribute('data-id');
                const post = PostsComponent_Instance.getPostById(postId);
                if (post) {
                    const modal = document.getElementById('edit-post-modal');
                    const titleInput = document.getElementById('edit-post-title');
                    const contentInput = document.getElementById('edit-post-content');
                    const categoryInput = document.getElementById('edit-post-category');
                    const collegeInput = document.getElementById('edit-post-college');
                    const saveBtn = document.getElementById('modal-save-btn');
                    
                    // Populate modal with current post data
                    titleInput.value = post.title;
                    contentInput.value = post.content;
                    if (categoryInput) {
                        categoryInput.value = post.category || 'discussion';
                    }
                    if (collegeInput) {
                        collegeInput.value = post.college || '';
                    }

                    // Update counters
                    const titleCounter = document.getElementById('title-counter');
                    const contentCounter = document.getElementById('content-counter');
                    if (titleCounter) titleCounter.textContent = titleInput.value.length + " / 100";
                    if (contentCounter) contentCounter.textContent = contentInput.value.length + " / 500";
                    
                    // Show modal
                    modal.style.display = 'flex';
                    
                    // Save handler
                    const saveHandler = () => {
                        const newTitle = titleInput.value.trim();
                        const newContent = contentInput.value.trim();
                        const newCategory = categoryInput ? categoryInput.value.trim() : (post.category || '');
                        const newCollege = collegeInput ? collegeInput.value.trim() : (post.college || '');
                        
                        if (newTitle === '') {
                            if (typeof AlertModal !== 'undefined') {
                                AlertModal.show('Title cannot be empty', 'error');
                            }
                            return;
                        }
                        
                        if (newContent === '') {
                            if (typeof AlertModal !== 'undefined') {
                                AlertModal.show('Content cannot be empty', 'error');
                            }
                            return;
                        }
                        
                        PostsComponent_Instance.editPost(postId, newTitle, newContent, newCategory, newCollege);
                        if (typeof AlertModal !== 'undefined') {
                            AlertModal.show('Post updated!', 'success');
                        }
                        
                        closeEditPostModal();
                        self.render();
                        self.attachListeners();
                        // Update stats sidebar
                        if (typeof window.updateProfileStats === 'function') {
                            window.updateProfileStats();
                        }
                    };
                    
                    // Remove old listener to prevent duplicates
                    saveBtn.onclick = saveHandler;
                    
                    // Close modal when clicking outside (on backdrop)
                    modal.onclick = (e) => {
                        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                            closeEditPostModal();
                        }
                    };
                }
            };
        });
        
        // Delete button handlers
        this.querySelectorAll('.post-delete-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const postId = btn.getAttribute('data-id');
                
                if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                    if (typeof PostsComponent_Instance !== 'undefined') {
                        PostsComponent_Instance.deletePost(postId);
                        if (typeof AlertModal !== 'undefined') {
                            AlertModal.show('Post deleted!', 'success');
                        }
                        self.render();
                        self.attachListeners();
                        // Update stats sidebar
                        if (typeof window.updateProfileStats === 'function') {
                            window.updateProfileStats();
                        }
                    }
                }
            };
        });
        
        // Close dropdown when clicking outside
        if (!this._outsideClickBound) {
            document.addEventListener('click', (e) => {
                const menus = this.querySelectorAll('.owner-action-dropdown');
                menus.forEach(menu => {
                    if (!menu.parentElement.contains(e.target)) {
                        menu.style.display = 'none';
                    }
                });
            });
            this._outsideClickBound = true;
        }
    }
}

customElements.define("profile-topbar", ProfileTopbar);
customElements.define("profile-sidebar", ProfileSidebar);
customElements.define("profile-main", ProfileMain);
customElements.define("profile-posts", ProfilePosts);
