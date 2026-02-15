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

  filterPosts();
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

  filterPosts();
  toggleFilter();
}

function filterPosts() {
  const rawInput = document.getElementById("searchInput")?.value || "";
  const searchInput = normalizeText(rawInput);

  const posts = document.querySelectorAll(".article");
  posts.forEach(post => {
    const title = normalizeText(post.querySelector(".headline")?.innerText || "");
    const content = normalizeText(post.querySelector(".excerpt")?.innerText || "");
    const category = String(post.getAttribute("data-category") || "discussion").toLowerCase();

    const matchesSearch = title.includes(searchInput) || content.includes(searchInput);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);

    post.style.display = (matchesSearch && matchesCategory) ? "block" : "none";
  });
}

function openPostModal(postId) {
  const post = PostsComponent_Instance.getPostById(postId);
  if (!post) return;

  const user = PostsComponent_Instance.getUserById(post.authorId) || {
    username: "Unknown",
    photo: "assets/placeholder.png"
  };

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

  renderComments(post);

  const modal = document.getElementById("post-view-modal");
  modal.style.display = "flex";
  modal.setAttribute("data-post-id", postId);

  const backdrop = modal.querySelector(".modal-backdrop");
  backdrop.onclick = function (e) {
    if (e.target === backdrop) modal.style.display = "none";
  };
}

function renderComments(post) {
  const commentsList = document.getElementById("comments-list");
  const commentCount = document.getElementById("comment-count");
  if (!commentsList || !commentCount) return;

  const tree = PostsComponent_Instance.getCommentTree(post.id);
  commentCount.textContent = (post.comments || []).length;
  commentsList.innerHTML = "";

  function renderNode(node, depth) {
    const wrapper = document.createElement("div");
    wrapper.className = "comment-item";
    wrapper.style.marginLeft = (depth * 18) + "px";

    const user = PostsComponent_Instance.getUserById(node.userId) || { username: "Unknown" };
    const score = PostsComponent_Instance.getCommentScore(node);

    wrapper.innerHTML = `
      <div class="comment-header poppins-regular">
        <span class="comment-author poppins-extrabold">${escapeHtml(user.username)}</span>
        <span class="comment-date">${escapeHtml(node.date || "")}</span>
      </div>

      <p class="comment-text poppins-regular">${escapeHtml(node.text)}</p>

      <div class="comment-actions" style="display:flex; gap:10px; align-items:center; margin-top:8px;">
        <button data-action="c_up" data-cid="${node.id}">👍</button>
        <button data-action="c_down" data-cid="${node.id}">👎</button>
        <span class="poppins-regular">Score ${score}</span>
        <button class="poppins-regular" data-action="c_reply_toggle" data-cid="${node.id}">Reply</button>
      </div>

      <div class="reply-box" data-replybox="${node.id}" style="display:none; margin-top:10px;">
        <textarea class="comment-textarea" rows="2" placeholder="Write a reply..."></textarea>
        <button class="submit-comment-btn poppins-extrabold" data-action="c_reply_submit" data-cid="${node.id}" style="margin-top:8px;">Reply</button>
      </div>
    `;

    commentsList.appendChild(wrapper);

    (node.replies || []).forEach(r => renderNode(r, depth + 1));
  }

  tree.forEach(n => renderNode(n, 0));
}

function closePostModal() {
  document.getElementById("post-view-modal").style.display = "none";
}

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
        renderDiscoverPosts();
      } else if (action === "down") {
        PostsComponent_Instance.voteOnPost(id, "down");
        renderDiscoverPosts();
      } else if (action === "open" || action === "comment") {
        PostsComponent_Instance.incrementViewCount(id);
        openPostModal(id);
      }
    };
  }

  // Top-level comment submit (modal)
  const submitBtn = document.getElementById("submit-comment-btn");
  if (submitBtn) {
    submitBtn.onclick = function () {
      const modal = document.getElementById("post-view-modal");
      const postId = modal.getAttribute("data-post-id");
      const commentText = (document.getElementById("comment-input").value || "").trim();
      const currentUserId = (localStorage.getItem("currentUserId") || "").trim();

      if (!currentUserId) {
        AlertModal.show("Please login to add comments.", "error");
        return;
      }
      if (!commentText) {
        AlertModal.show("Comment cannot be empty.", "error");
        return;
      }

      PostsComponent_Instance.addComment(postId, currentUserId, commentText);

      document.getElementById("comment-input").value = "";
      const post = PostsComponent_Instance.getPostById(postId);
      renderComments(post);

      AlertModal.show("Comment posted!", "success");
      renderDiscoverPosts();
    };
  }

  // Replies + like/dislike on comments (modal)
  const commentsList = document.getElementById("comments-list");
  if (commentsList) {
    commentsList.onclick = function (e) {
      const btn = e.target.closest("button");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const cid = btn.getAttribute("data-cid");
      if (!action || !cid) return;

      const modal = document.getElementById("post-view-modal");
      const postId = modal.getAttribute("data-post-id");
      const currentUserId = (localStorage.getItem("currentUserId") || "").trim();

      if (!currentUserId) {
        AlertModal.show("Please login to interact with comments.", "error");
        return;
      }

      if (action === "c_up") {
        PostsComponent_Instance.voteOnComment(postId, cid, "up", currentUserId);
      } else if (action === "c_down") {
        PostsComponent_Instance.voteOnComment(postId, cid, "down", currentUserId);
      } else if (action === "c_reply_toggle") {
        const box = document.querySelector(`[data-replybox="${cid}"]`);
        if (box) box.style.display = (box.style.display === "none" ? "block" : "none");
        return;
      } else if (action === "c_reply_submit") {
        const box = document.querySelector(`[data-replybox="${cid}"]`);
        const ta = box ? box.querySelector("textarea") : null;
        const text = (ta ? ta.value : "").trim();

        if (!text) {
          AlertModal.show("Reply cannot be empty.", "error");
          return;
        }

        PostsComponent_Instance.replyToComment(postId, cid, currentUserId, text);
        if (ta) ta.value = "";
        AlertModal.show("Reply posted!", "success");
      }

      const post = PostsComponent_Instance.getPostById(postId);
      renderComments(post);
      renderDiscoverPosts();
    };
  }
});