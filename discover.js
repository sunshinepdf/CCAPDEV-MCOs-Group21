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
