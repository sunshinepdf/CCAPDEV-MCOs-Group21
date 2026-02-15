document.addEventListener("DOMContentLoaded", function () {
    var storageKey = "animoProfile";

    function parseJson(value) {
        try {
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }

    // Check if user is logged in, lock entire profile if not
    var isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
    if (!isLoggedIn) {
        var contentBox = document.querySelector(".content-box");
        if (contentBox) {
            contentBox.classList.add("locked");
        }
    }

    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function prettyCategory(cat) {
        const c = String(cat || "").toLowerCase();
        if (c === "news") return "News";
        if (c === "help") return "Help";
        return "Discussion";
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

    // Comment submission
    const submitBtn = document.getElementById("submit-comment-btn");
    if (submitBtn) {
        submitBtn.onclick = function() {
            const modal = document.getElementById("post-view-modal");
            const postId = modal.getAttribute("data-post-id");
            const commentText = document.getElementById("comment-input").value.trim();
            const currentUserId = (localStorage.getItem("currentUserId") || "").trim();
            
            if (!currentUserId) {
                AlertModal.show("Please login to add comments.", "error");
                return;
            }
            
            if (!commentText) {
                AlertModal.show("Comment cannot be empty.", "error");
                return;
            }
            
            const post = PostsComponent_Instance.getPostById(postId);
            if (!post) return;
            
            // Add comment to post
            post.comments = post.comments || [];
            post.comments.push({
                userId: currentUserId,
                text: commentText,
                date: new Date().toLocaleDateString()
            });
            
            // Save to localStorage
            localStorage.setItem('mockDatabase', JSON.stringify(PostsComponent_Instance.getDatabase()));
            
            // Clear input and re-render
            document.getElementById("comment-input").value = "";
            renderComments(post);
            AlertModal.show("Comment posted!", "success");
        };
    }
});

function openCreatePostModal() {
  var currentUser = (localStorage.getItem("currentUserId") || "").trim();

  if (!currentUser) {
    AlertModal.show("You must be logged in to create a post.", "error");
    return;
  }

  var modal = document.getElementById("create-post-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeCreatePostModal() {
  var modal = document.getElementById("create-post-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

