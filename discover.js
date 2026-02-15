let selectedCategories = [];

function renderDiscoverPosts() {
    const container = document.getElementById("discoverPosts");
    if (!container) return;

    container.innerHTML = "";

    let db = mockDatabase;
    const saved = localStorage.getItem("mockDatabase");
    if (saved) {
        db = JSON.parse(saved);
    }

    if (!db.posts || db.posts.length === 0) {
        container.innerHTML = "<p>No posts found.</p>";
        return;
    }
    generateCategoryFilters(db);

    const sortedPosts = [...db.posts].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    sortedPosts.forEach(post => {
        const user = db.users.find(u => u.id === post.authorId) || { username: "Unknown" };

        const postCard = document.createElement("div");
        postCard.className = "post-card";
        postCard.setAttribute("data-category", post.category.toLowerCase());

        postCard.innerHTML = `
            <div class="post-header">
                <div class="user-info">
                    <img src="assets/placeholder.png" class="avatar">
                    <span class="username">${user.username}</span>
                    <span class="meta">· ${post.date} • ${post.views || 0} views</span>
                </div>
            </div>

            <hr>

            <h3 class="post-title">${post.title}</h3>
            <p class="post-desc">${post.content}</p>

            <div class="tags">
                <span>${post.category}</span>
            </div>
        `;

        postCard.addEventListener("click", () => {
            openPostView(post.id);
        });

        container.appendChild(postCard);
    });
}


function toggleFilter() {
    const overlay = document.getElementById("filterOverlay");
    overlay.style.display = overlay.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
    const overlay = document.getElementById("filterOverlay");
    const panel = document.getElementById("filterPanel");

    if (!overlay.contains(event.target) && event.target.closest(".filter-btn") == null) {
        overlay.style.display = "none";
    }

    if (event.target === overlay) {
        overlay.style.display = "none";
    }
});

function generateCategoryFilters(db) {
    const container = document.getElementById("dynamicFilters");
    container.innerHTML = "";

    const categories = [...new Set(
        db.posts.map(post => post.category.toLowerCase())
    )];

    categories.forEach(category => {
        const label = document.createElement("label");
        label.className = "filter-option";

        label.innerHTML = `
            <input type="checkbox" value="${category}">
            <span class="tags-preview">
                <span>${capitalize(category)}</span>
            </span>
        `;

        container.appendChild(label);
    });
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}


function applyFilters() {
    const checkboxes = document.querySelectorAll(".filter-panel input[type='checkbox']");
    selectedCategories = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedCategories.push(cb.value.toLowerCase());
        }
    });

    filterPosts();
    toggleFilter();
}

function filterPosts() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const posts = document.querySelectorAll(".post-card");

    posts.forEach(post => {
        const title = post.querySelector(".post-title").innerText.toLowerCase();
        const content = post.querySelector(".post-desc").innerText.toLowerCase();
        const category = post.getAttribute("data-category");

        const matchesSearch =
            title.includes(searchInput) || content.includes(searchInput);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(category);

        post.style.display = (matchesSearch && matchesCategory) ? "flex" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderDiscoverPosts();
});

function openPostView(postId) {
    let db = mockDatabase;
    const saved = localStorage.getItem("mockDatabase");
    if (saved) {
        db = JSON.parse(saved);
    }

    const post = db.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];

    const grid = document.getElementById("discoverPosts");
    const singleView = document.getElementById("singlePostView");

    grid.style.display = "none";
    singleView.style.display = "block";

    singleView.innerHTML = `
        <div class="single-post-card">
            <button class="back-btn" onclick="closePostView()">← Back</button>

            <h2 class="single-post-title">${post.title}</h2>
            <p class="single-post-content">${post.content}</p>

            <div class="tags">
                <span>${post.category}</span>
            </div>

            <div class="comment-section">
                <h3>Comments</h3>

                <div class="comment-input-wrapper">
                    <input type="text" id="newComment" placeholder="Write a comment...">
                    <button onclick="addComment(${post.id})">Post</button>
                </div>

                <div id="commentsList">
                    ${post.comments.map(c => `
                        <div class="comment-item">${c}</div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}

function closePostView() {
    document.getElementById("singlePostView").style.display = "none";
    document.getElementById("discoverPosts").style.display = "grid";
}

function addComment(postId) {
    const input = document.getElementById("newComment");
    const text = input.value.trim();
    if (!text) return;

    let db = mockDatabase;
    const saved = localStorage.getItem("mockDatabase");
    if (saved) {
        db = JSON.parse(saved);
    }

    const post = db.posts.find(p => p.id === postId);
    if (!post.comments) post.comments = [];

    post.comments.push(text);

    localStorage.setItem("mockDatabase", JSON.stringify(db));

    openPostView(postId);
}
