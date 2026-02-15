let selectedCategories = [];

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""); 
}

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
        const user =
            db.users.find(u => u.id === post.authorId) ||
            { username: "Unknown" };

        const locked = false; // you can add lock logic later
        const article = buildNewspaperArticle(post, 0, locked);
        container.appendChild(article);

    });
}

function toggleFilter() {
    const overlay = document.getElementById("filterOverlay");
    overlay.style.display =
        overlay.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
    const overlay = document.getElementById("filterOverlay");
    const panel = document.getElementById("filterPanel");

    if (!overlay || !panel) return;

    if (!overlay.contains(event.target) &&
        event.target.closest(".filter-btn") == null) {
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
    const checkboxes = document.querySelectorAll(
        ".filter-panel input[type='checkbox']"
    );

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
    const rawInput = document.getElementById("searchInput").value;
    const searchInput = normalizeText(rawInput);

    const posts = document.querySelectorAll(".article");

    posts.forEach(post => {
        const title = normalizeText(
            post.querySelector(".headline").innerText
        );

        const content = normalizeText(
            post.querySelector(".excerpt").innerText
        );

        const category = post.getAttribute("data-category");

        const matchesSearch =
            title.includes(searchInput) ||
            content.includes(searchInput);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(category);

        post.style.display =
            (matchesSearch && matchesCategory) ? "block" : "none";
    });
}


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
    filterPosts();
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

document.addEventListener("DOMContentLoaded", () => {
    renderDiscoverPosts();
    setDiscoverDate();
});

function setDiscoverDate() {
    const dateElement = document.getElementById("discoverDate");
    if (!dateElement) return;

    dateElement.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function buildNewspaperArticle(post, index, locked) {
    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function excerpt(text, n) {
        var t = String(text || "").trim().replace(/\s+/g, " ");
        if (t.length <= n) return t;
        return t.slice(0, n).trim() + "…";
    }

    function prettyCategory(cat) {
        var c = String(cat || "").toLowerCase();
        if (c === "news") return "News";
        if (c === "help") return "Help";
        return "Discussion";
    }

    const score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);

    const el = document.createElement("article");
    el.className = "article" + (locked ? " locked" : "");
    el.setAttribute("data-locked", locked ? "1" : "0");
    el.setAttribute("data-id", post.id);

    el.innerHTML =
        '<div class="section-row poppins-regular">' +
            '<span>' + prettyCategory(post.category) + '</span>' +
            '<span>' + (Number(post.views) || 0) + ' views</span>' +
        '</div>' +
        '<h2 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h2>' +
        '<div class="byline poppins-regular">By <b>' + escapeHtml(post.authorId) + '</b> • ' + escapeHtml(post.date) + '</div>' +
        '<div class="rule"></div>' +
        '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, 140)) + '</p>' +
        '<div class="article-actions">' +
            '<span class="chip poppins-regular">Score: <b>' + score + '</b></span>' +
            '<div class="vote">' +
                '<button type="button" data-action="up" data-id="' + post.id + '">▲</button>' +
                '<button type="button" data-action="down" data-id="' + post.id + '">▼</button>' +
            '</div>' +
            '<button class="open-btn" type="button" data-action="open" data-id="' + post.id + '">Open</button>' +
        '</div>';

    return el;
}

document.getElementById("discoverPosts").onclick = function (e) {
    const t = e.target;
    if (!t) return;

    const action = t.getAttribute("data-action");
    const id = t.getAttribute("data-id");
    if (!action || !id) return;

    let db = mockDatabase;
    const saved = localStorage.getItem("mockDatabase");
    if (saved) db = JSON.parse(saved);

    const post = db.posts.find(p => p.id === id);
    if (!post) return;

    post.votes = post.votes || {};
    const userId = (localStorage.getItem("currentUserId") || "").trim();
    if (!userId) {
        AlertModal.show("Please login to interact.", "error");
        return;
    }

    const prev = post.votes[userId] || null;

    function applyVote(next) {
        if (prev === "up") post.upvotes--;
        if (prev === "down") post.downvotes--;

        if (next === "up") post.upvotes++;
        if (next === "down") post.downvotes++;

        if (next) post.votes[userId] = next;
        else delete post.votes[userId];
    }

    if (action === "up") {
        applyVote(prev === "up" ? null : "up");
        AlertModal.show("Vote updated!", "success");
    }

    if (action === "down") {
        applyVote(prev === "down" ? null : "down");
        AlertModal.show("Vote updated!", "success");
    }

    if (action === "open") {
        openPostView(id);
        return;
    }

    localStorage.setItem("mockDatabase", JSON.stringify(db));
    renderDiscoverPosts();
};
