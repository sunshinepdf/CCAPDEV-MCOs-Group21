let selectedCategories = [];

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalize(text) {
  text = String(text || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function prettyCategory(cat) {
  const c = String(cat || "").toLowerCase();
  if (c === "news") return "News";
  if (c === "help") return "Help";
  return "Discussion";
}

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

  const sortedPosts = PostsComponent_Instance.getFilteredPosts({ sortBy: "hot" });
  const isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
  const FREE_COUNT = 14; // 0-14 = 15 free posts

  sortedPosts.forEach((post, index) => {
    const locked = !isLoggedIn && index >= FREE_COUNT;
    const article = PostsComponent_Instance.buildNewspaperArticle(post, index, locked);
    container.appendChild(article);
  });

  filterPostsWithCategories();
}

function toggleFilter() {
  const overlay = document.getElementById("filterOverlay");
  if (!overlay) return;
  overlay.style.display = overlay.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (event) {
  const overlay = document.getElementById("filterOverlay");
  const panel = document.getElementById("filterPanel");
  if (!overlay || !panel) return;

  if (!overlay.contains(event.target) && event.target.closest(".filter-btn") == null) {
    overlay.style.display = "none";
  }

  if (event.target === overlay) {
    overlay.style.display = "none";
  }
});

function generateCategoryFilters(db) {
  const container = document.getElementById("dynamicFilters");
  if (!container) return;
  container.innerHTML = "";

  const categories = [...new Set(
    (db.posts || []).map(post => String(post.category || "discussion").toLowerCase())
  )];

  categories.forEach(category => {
    const label = document.createElement("label");
    label.className = "filter-option";
    label.innerHTML = `
      <input type="checkbox" value="${category}">
      <span class="tags-preview"><span>${capitalize(category)}</span></span>
    `;
    container.appendChild(label);
  });
}

function applyFilters() {
  const checkboxes = document.querySelectorAll(".filter-panel input[type='checkbox']");
  selectedCategories = [];

  checkboxes.forEach(cb => {
    if (cb.checked) selectedCategories.push(String(cb.value || "").toLowerCase());
  });

  filterPostsWithCategories();
  toggleFilter();
}

function filterPostsWithCategories() {
  const searchBar = document.querySelector("search-bar");
  const rawInput = searchBar?.getValue() || "";
  const searchInput = normalizeText(rawInput);

  const posts = document.querySelectorAll(".article");
  posts.forEach(post => {
    const title = normalizeText(post.querySelector(".headline")?.innerText || "");
    const content = normalizeText(post.querySelector(".excerpt")?.innerText || "");
    const category = String(post.getAttribute("data-category") || "discussion").toLowerCase();

    const matchesSearch = searchInput === "" || title.includes(searchInput) || content.includes(searchInput);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);

    post.style.display = (matchesSearch && matchesCategory) ? "block" : "none";
  });
}

// Expose for search-bar component
window.filterPostsWithCategories = filterPostsWithCategories;

document.addEventListener("DOMContentLoaded", () => {
  setDiscoverDate();
  renderDiscoverPosts();

  // Post actions (vote/open) with DOM lock check
  const discoverGrid = document.getElementById("discoverPosts");
  if (discoverGrid) {
    discoverGrid.onclick = function (e) {
      const t = e.target;
      if (!t) return;

      const action = t.getAttribute("data-action");
      const id = t.getAttribute("data-id");
      if (!action || !id) return;

      const article = t.closest(".article");
      const isLocked = article && article.getAttribute("data-locked") === "1";

      const currentUserId = (localStorage.getItem("currentUserId") || "").trim();
      const loggedIn = currentUserId.length > 0;

      if (!loggedIn || isLocked) {
        AlertModal.show("Please login or sign up to view and interact with posts.", "error");
        return;
      }

      if (action === "up") {
        PostsComponent_Instance.voteOnPost(id, "up");
        // Update just the vote counts instead of full re-render
        const post = PostsComponent_Instance.getPostById(id);
        if (post && article) {
          const upvotes = Number(post.upvotes) || 0;
          const downvotes = Number(post.downvotes) || 0;
          const voteCounts = article.querySelector(".section-row span");
          if (voteCounts) {
            voteCounts.innerHTML = (Number(post.views) || 0) + ' Views &#8226; ▲ ' + upvotes + ' ▼ ' + downvotes;
          }
          // Update active states
          const upBtn = article.querySelector('[data-action="up"]');
          const downBtn = article.querySelector('[data-action="down"]');
          const userVote = (post.votes && currentUserId && post.votes[currentUserId]) ? post.votes[currentUserId] : null;
          if (upBtn) upBtn.setAttribute('data-active', userVote === 'up' ? '1' : '0');
          if (downBtn) downBtn.setAttribute('data-active', userVote === 'down' ? '1' : '0');
        }
      } else if (action === "down") {
        PostsComponent_Instance.voteOnPost(id, "down");
        // Update just the vote counts instead of full re-render
        const post = PostsComponent_Instance.getPostById(id);
        if (post && article) {
          const upvotes = Number(post.upvotes) || 0;
          const downvotes = Number(post.downvotes) || 0;
          const voteCounts = article.querySelector(".section-row span");
          if (voteCounts) {
            voteCounts.innerHTML = (Number(post.views) || 0) + ' Views &#8226; ▲ ' + upvotes + ' ▼ ' + downvotes;
          }
          // Update active states
          const upBtn = article.querySelector('[data-action="up"]');
          const downBtn = article.querySelector('[data-action="down"]');
          const userVote = (post.votes && currentUserId && post.votes[currentUserId]) ? post.votes[currentUserId] : null;
          if (upBtn) upBtn.setAttribute('data-active', userVote === 'up' ? '1' : '0');
          if (downBtn) downBtn.setAttribute('data-active', userVote === 'down' ? '1' : '0');
        }
      } else if (action === "open" || action === "comment") {
        window.openPostModal(id);
      }
    };
  }
});

// Expose render function globally for comment updates
window.triggerPostsUpdate = renderDiscoverPosts;