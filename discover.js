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

    const db = PostsComponent_Instance.getDatabase();

    if (!db.posts || db.posts.length === 0) {
        container.innerHTML = "<p>No posts found.</p>";
        return;
    }
    generateCategoryFilters(db);

    const sortedPosts = PostsComponent_Instance.getFilteredPosts({ sortBy: 'hot' });
    const isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
    const FREE_COUNT = 14; // 0-14 = 15 free posts

    sortedPosts.forEach((post, index) => {
        const locked = !isLoggedIn && index >= FREE_COUNT;
        const article = PostsComponent_Instance.buildNewspaperArticle(post, index, locked);
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


function openPostModal(postId) {
    const post = PostsComponent_Instance.getPostById(postId);
    if (!post) return;
    
    const user = PostsComponent_Instance.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };
    const score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);
    
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
    
    // Render full article in modal
    const modalContent = document.getElementById("modal-post-content");
    modalContent.innerHTML = 
        '<div class="post-author-header poppins-regular">' +
            '<img src="' + user.photo + '" alt="' + escapeHtml(user.username) + '" class="post-author-avatar">' +
            '<div class="post-author-info">' +
                '<span class="post-author-username poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
                '<span class="post-author-date">' + escapeHtml(post.date) + (post.lastEdited ? ' &#8226; Edited ' + post.lastEdited : '') + '</span>' +
            '</div>' +
        '</div>' +
        '<h2 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h2>' +
        '<div class="section-row poppins-regular">' +
            '<span>' + (Number(post.views) || 0) + ' Views &#8226; &#9650; ' + (Number(post.upvotes) || 0) + ' &#9660; ' + (Number(post.downvotes) || 0) + '</span>' +
        '</div>' +
        '<div class="rule"></div>' +
        '<p class="excerpt poppins-regular">' + escapeHtml(post.content) + '</p>' +
        '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';
    
    // Render comments
    renderComments(post);
    
    // Show modal
    const modal = document.getElementById("post-view-modal");
    modal.style.display = "flex";
    modal.setAttribute("data-post-id", postId);
    
    // Close backdrop click
    const backdrop = modal.querySelector(".modal-backdrop");
    backdrop.onclick = function(e) {
        if (e.target === backdrop) {
            modal.style.display = "none";
        }
    };
}

function renderComments(post) {
    const comments = post.comments || [];
    const commentsList = document.getElementById("comments-list");
    const commentCount = document.getElementById("comment-count");
    
    commentCount.textContent = comments.length;
    commentsList.innerHTML = "";
    
    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
    
    comments.forEach(function(comment) {
        const commentEl = document.createElement("div");
        commentEl.className = "comment-item";
        
        const user = PostsComponent_Instance.getUserById(comment.userId) || { username: "Unknown" };
        
        commentEl.innerHTML = 
            '<div class="comment-header poppins-regular">' +
                '<span class="comment-author poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
                '<span class="comment-date">' + escapeHtml(comment.date || new Date().toLocaleDateString()) + '</span>' +
            '</div>' +
            '<p class="comment-text poppins-regular">' + escapeHtml(comment.text) + '</p>';
        
        commentsList.appendChild(commentEl);
    });
}

function closePostModal() {
    document.getElementById('post-view-modal').style.display = 'none';
}

function openPostView(postId) {
    let db = PostsComponent_Instance.getDatabase();

    const post = db.posts.find(p => String(p.id) === String(postId));
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
                <span class="post-tag">${post.category}</span>
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

    PostsComponent_Instance.incrementViewCount(postId);
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

    let db = PostsComponent_Instance.getDatabase();

    const post = db.posts.find(p => String(p.id) === String(postId));
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
    return PostsComponent_Instance.buildNewspaperArticle(post, index, locked);
}

document.getElementById("discoverPosts").onclick = function (e) {
    const t = e.target;
    if (!t) return;

    const action = t.getAttribute("data-action");
    const id = t.getAttribute("data-id");
    if (!action || !id) return;

    const post = PostsComponent_Instance.getPostById(id);
    if (!post) return;

    const isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
    const isLocked = post && post.locked;

    if (!isLoggedIn || isLocked) {
        AlertModal.show("Please login or sign up to view and interact with posts.", "error");
        return;
    }

    if (action === "up") {
        PostsComponent_Instance.voteOnPost(id, "up");
        renderDiscoverPosts();
    } else if (action === "down") {
        PostsComponent_Instance.voteOnPost(id, "down");
        renderDiscoverPosts();
    } else if (action === "open" || action === "comment") {
        PostsComponent_Instance.incrementViewCount(id);
        openPostModal(id);
    }
};

// Comment submission for discover
document.addEventListener("DOMContentLoaded", function() {
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