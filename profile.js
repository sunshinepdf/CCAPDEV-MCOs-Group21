document.addEventListener("DOMContentLoaded", function () {
    var storageKey = "animoProfile";

    function parseJson(value) {
        try {
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }

    function getDatabase() {
        var localDb = parseJson(localStorage.getItem("mockDatabase"));
        return typeof mockDatabase !== "undefined" ? mockDatabase : localDb;
    }

    function getCurrentUserId() {
        return typeof CURRENT_USER_ID !== "undefined" ? CURRENT_USER_ID : "u1";
    }

    function loadProfileData() {
        var db = getDatabase();
        var currentUserId = getCurrentUserId();

        if (db && Array.isArray(db.users)) {
            var user = db.users.find(function (item) {
                return item && item.id === currentUserId;
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

        var localProfile = parseJson(localStorage.getItem(storageKey));
        return localProfile || {};
    }

    function saveProfileData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    var data = loadProfileData();

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

    if (postsStatEl || reputationStatEl) {
        var db = getDatabase();
        var currentUserId = getCurrentUserId();
        if (db && Array.isArray(db.posts)) {
            var postCount = 0;
            var reputationTotal = 0;
            db.posts.forEach(function (post) {
                if (!post || post.authorId !== currentUserId) {
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
});
