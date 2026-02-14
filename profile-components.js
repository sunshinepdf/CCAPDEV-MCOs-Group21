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
            '<div class="profile-search-bar" id="profile-search-bar">' +
            '<img src="assets/search-icon.png" alt="search" width="16" height="16" class="search-icon">' +
            '<input type="text" id="profile-search-input" placeholder="Find previous posts...">' +
            '</div>' +
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
        this.innerHTML =
            '<div class="profile-main" id="profile-main">' +
            '<div class="user-profile-header" id="profile-header">' +
            '<div class="profile-avatar" id="profile-avatar">' +
            '<img src="assets/placeholder.png" alt="Profile photo" id="profile-avatar-img">' +
            '</div>' +
            '<div class="profile-info">' +
            '<button class="btn-edit-profile poppins-extrabold" id="edit-profile-button" onclick="window.location.href=\'edit-profile.html\'">Edit Profile</button>' +
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
    }

    render() {
        this.innerHTML =
            '<section class="profile-posts-section card card--dark" id="profile-posts-section">' +
            '<h1 class="poppins-extrabold card__title">User Posts</h1>' +
            '<div class="profile-posts" id="profile-posts-list">' +
            '<div class="profile-post card card--light" id="profile-post-1">' +
            '<h3 class="post-title poppins-extrabold">My First Post</h3>' +
            '<p class="post-content poppins-regular">This is the content of my first post. I\'m excited to share my thoughts with the community!</p>' +
            '<div class="post-meta poppins-regular">Posted on Jan 1, 2026 - 150 views</div>' +
            '</div>' +
            '<div class="profile-post card card--light" id="profile-post-2">' +
            '<h3 class="post-title poppins-extrabold">What\'s the best coffee spot around campus?</h3>' +
            '<p class="post-content poppins-regular">Hi! I\'m looking for a good coffee spot around campus. Do any of you guys have suggestions?</p>' +
            '<div class="post-meta poppins-regular">Posted on Feb 4, 2026 - 150 views</div>' +
            '</div>' +
            '<div class="profile-post card card--light" id="profile-post-3">' +
            '<h3 class="post-title poppins-extrabold">67</h3>' +
            '<p class="post-content poppins-regular">can we stop using six-seven. PLEASE. it\'s like waking up sleeper agents in my class all THE TIME. IT IS SOOOO ANNOYING.</p>' +
            '<div class="post-meta poppins-regular">Posted on Feb 4, 2026 - 150 views</div>' +
            '</div>' +
            '</div>' +
            '</section>';
    }
}

customElements.define("profile-topbar", ProfileTopbar);
customElements.define("profile-sidebar", ProfileSidebar);
customElements.define("profile-main", ProfileMain);
customElements.define("profile-posts", ProfilePosts);
