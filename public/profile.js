// Define these functions immediately so they're available to profile-components.js
function getCurrentUserId() {
    return (sessionStorage.getItem("currentUserId") || "").trim();
}

// Get the userId from URL parameter if viewing another user's profile
function getViewedUserId() {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    return userIdParam || getCurrentUserId();
}

// Check if viewing own profile
function isViewingOwnProfile() {
    return getViewedUserId() === getCurrentUserId();
}

// Expose profile viewing info globally immediately
window.getViewedUserId = getViewedUserId;
window.isViewingOwnProfile = isViewingOwnProfile;

document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in, lock entire profile if not
    var isLoggedIn = (sessionStorage.getItem("currentUserId") || "").trim().length > 0;
    if (!isLoggedIn) {
        var contentBox = document.querySelector(".content-box");
        if (contentBox) {
            contentBox.classList.add("locked");
        }
    }

    function getDatabase() {
        return typeof mockDatabase !== "undefined" && mockDatabase ? mockDatabase : { users: [], posts: [] };
    }

    function loadProfileData() {
        var db = getDatabase();
        var viewedUserId = getViewedUserId();

        if (db && Array.isArray(db.users)) {
            var user = db.users.find(function (item) {
                return item && item.id === viewedUserId;
            });
            if (user) {
                return {
                    name: user.username || "",
                    aboutTitle: "About Me",
                    bio: user.bio || "",
                    pronouns: user.pronouns || "",
                    year: user.year || "",
                    major: user.major || "",
                    avatar: user.photo || "",
                    tags: Array.isArray(user.tags) ? user.tags.slice() : []
                };
            }
        }

        return {};
    }

    var data = loadProfileData();

    async function hydrateViewedUser() {
        var viewedUserId = getViewedUserId();
        if (!viewedUserId || !window.apiRequest) return;

        try {
            // GET: load a user's public profile by ID
            var payload = await window.apiRequest("/api/users/" + encodeURIComponent(viewedUserId), { method: "GET" });
            if (!payload || !payload.user) return;

            var mapped = window.mapApiUser ? window.mapApiUser(payload.user) : payload.user;
            if (!mapped || !mapped.id) return;

            var db = getDatabase();
            db.users = Array.isArray(db.users) ? db.users : [];

            var idx = db.users.findIndex(function (u) { return u && String(u.id) === String(mapped.id); });
            if (idx >= 0) db.users[idx] = Object.assign({}, db.users[idx], mapped);
            else db.users.push(mapped);

            window.mockDatabase = db;

            var refreshed = loadProfileData();
            if (nameEl && refreshed.name) nameEl.textContent = refreshed.name;
            if (bioEl) bioEl.textContent = refreshed.bio || "";
            if (pronounsEl) pronounsEl.textContent = refreshed.pronouns || "";
            if (yearEl) yearEl.textContent = refreshed.year || "";
            if (majorEl) majorEl.textContent = refreshed.major || "";
            if (avatarEl && refreshed.avatar) avatarEl.src = refreshed.avatar;
            if (Array.isArray(refreshed.tags)) {
                tags = refreshed.tags.slice();
                renderTags(tagsView);
            }
            updateStats();
        } catch (error) {}
    }

    window.addEventListener("animo:data-ready", function () {
        var refreshed = loadProfileData();
        if (nameEl && refreshed.name) nameEl.textContent = refreshed.name;
        if (bioEl) bioEl.textContent = refreshed.bio || "";
        if (pronounsEl) pronounsEl.textContent = refreshed.pronouns || "";
        if (yearEl) yearEl.textContent = refreshed.year || "";
        if (majorEl) majorEl.textContent = refreshed.major || "";
        if (avatarEl && refreshed.avatar) avatarEl.src = refreshed.avatar;
        if (Array.isArray(refreshed.tags)) {
            tags = refreshed.tags.slice();
            renderTags(tagsView);
        }
        updateStats();
    });

    var nameEl = document.getElementById("profile-name");
    var aboutTitleEl = document.getElementById("profile-about-title");
    var bioEl = document.getElementById("profile-bio");
    var pronounsEl = document.getElementById("profile-pronouns");
    var yearEl = document.getElementById("profile-year");
    var majorEl = document.getElementById("profile-major");
    var avatarEl = document.getElementById("profile-avatar-img");
    var tagsView = document.getElementById("profile-tags");
    var postsStatEl = document.getElementById("stats-posts");
    var reputationStatEl = document.getElementById("stats-reputation");

    if (nameEl && data.name) {
        nameEl.textContent = data.name;
    }
    if (aboutTitleEl && data.aboutTitle) {
        aboutTitleEl.textContent = data.aboutTitle;
    }
    if (bioEl && data.bio) {
        bioEl.textContent = data.bio;
    }
    if (pronounsEl && data.pronouns) {
        pronounsEl.textContent = data.pronouns;
    }
    if (yearEl && data.year) {
        yearEl.textContent = data.year;
    }
    if (majorEl && data.major) {
        majorEl.textContent = data.major;
    }
    if (avatarEl && data.avatar) {
        avatarEl.src = data.avatar;
    }

    // Function to update stats
    function updateStats() {
        var postsStatEl = document.getElementById("stats-posts");
        var reputationStatEl = document.getElementById("stats-reputation");
        
        if (postsStatEl || reputationStatEl) {
            var db = getDatabase();
            var viewedUserId = getViewedUserId();
            if (db && Array.isArray(db.posts)) {
                var postCount = 0;
                var reputationTotal = 0;
                db.posts.forEach(function (post) {
                    if (!post || post.authorId !== viewedUserId) {
                        return;
                    }
                    postCount += 1;
                    var upvotes = Number(post.upvotes) || 0;
                    var downvotes = Number(post.downvotes) || 0;
                    reputationTotal += upvotes - downvotes;
                });

                if (postsStatEl) {
                    postsStatEl.textContent = String(postCount);
                }
                if (reputationStatEl) {
                    reputationStatEl.textContent = String(reputationTotal);
                }
            }
        }
    }

    // Initial stats update
    updateStats();

    // Expose updateStats globally for profile-components to use
    window.updateProfileStats = updateStats;

    var defaultTags = ["CCS", "ID 124", "Friendly"];
    var tags = Array.isArray(data.tags) && data.tags.length ? data.tags.slice() : defaultTags.slice();

    function renderTags(container) {
        if (!container) {
            return;
        }
        container.innerHTML = "";
        tags.forEach(function (tag, index) {
            var tagEl = document.createElement("div");
            tagEl.className = "profile-tag";

            var label = document.createElement("span");
            label.className = "poppins-extrabold";
            label.textContent = tag;
            tagEl.appendChild(label);

            container.appendChild(tagEl);
        });
    }

    renderTags(tagsView);

    // Function to refresh profile posts
    function refreshProfilePosts() {
        const profilePostsElement = document.querySelector('profile-posts');
        if (profilePostsElement) {
            profilePostsElement.render();
            profilePostsElement.attachListeners();
        }
    }

    // Expose render function globally for comment updates
    window.triggerPostsUpdate = refreshProfilePosts;

    hydrateViewedUser();
});

function closeEditPostModal() {
  var modal = document.getElementById("edit-post-modal");
  if (modal) {
    modal.style.display = "none";
  }
}
