/* posts-component.js
   Animo Commons — PostsComponent (GLOBAL)

   ✅ Posts rendering (newspaper + cards)
   ✅ Per-user post vote toggling (up/down)
   ✅ Views + lastEdited support
   ✅ Filtering / sorting (recent/hot/top/trending)

   ✅ COMMENTS (All Pages)
   - Logged-in users can comment on any post (including their own)
   - Comment shows: avatar + username + timestamp
   - Replies create threads (indented)
   - Owner can edit/delete anytime
   - Edited indicator shown
   - Comment upvote/downvote (per-user toggle like posts)

   IMPORTANT:
   - Pages must NOT define their own openPostModal/renderComments/comment submit logic.
   - Use the global openPostModal() from this file.
*/

(function () {
  const GUEST_FREE_POST_COUNT = 15;

  // -------------------------
  // Utilities
  // -------------------------
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function prettyCategory(cat) {
    var c = String(cat || "").toLowerCase();
    if (c === "news") return "News";
    if (c === "help") return "Help";
    return "Discussion";
  }

  function prettyCollege(college) {
    var c = String(college || "").toUpperCase();
    return c;
  }

  function excerpt(text, n) {
    var t = String(text || "").trim().replace(/\s+/g, " ");
    if (t.length <= n) return t;
    return t.slice(0, n).trim() + "…";
  }

  function formatTs(ts) {
    // ts can be millis, ISO string, or "Feb 11, 2026"
    if (!ts) return "";
    if (typeof ts === "string" && ts.match(/^\w{3}\s+\d{1,2},\s+\d{4}$/)) return ts;

    var d = (typeof ts === "number") ? new Date(ts) : new Date(String(ts));
    if (isNaN(d.getTime())) return String(ts);

    return d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function nowTs() { return Date.now(); }

  function getHotTimestamp(post) {
    if (!post) return 0;

    var lastUpvotedAt = Number(post.lastUpvotedAt) || 0;
    if (lastUpvotedAt > 0) return lastUpvotedAt;

    var upvotes = Number(post.upvotes) || 0;
    if (upvotes <= 0) return 0;

    var legacyFallback = new Date(post.lastInteraction || post.createdAt || post.date || 0).getTime();
    return Number.isNaN(legacyFallback) ? 0 : legacyFallback;
  }

  function getCurrentUserId() {
    return (localStorage.getItem("currentUserId") || "").trim();
  }

  function normalizeId(value) {
    if (value == null) return "";
    if (typeof value === "object") {
      if (value.id != null) return String(value.id);
      if (value._id != null) return String(value._id);
      if (typeof value.toString === "function" && value.toString !== Object.prototype.toString) {
        return String(value.toString());
      }
      return "";
    }
    return String(value);
  }

  function makeId(prefix) {
    return prefix + "_" + nowTs() + "_" + Math.floor(Math.random() * 999999);
  }

  function closeOwnerActionMenus(root, except) {
    var scope = root || document;
    scope.querySelectorAll(".owner-action-dropdown").forEach(function (menu) {
      if (menu !== except) {
        menu.style.display = "none";
      }
    });
  }

  function toggleOwnerActionMenu(root, dropdown) {
    if (!dropdown) return;

    var isOpen = dropdown.style.display === "block";
    closeOwnerActionMenus(root, dropdown);
    dropdown.style.display = isOpen ? "none" : "block";
  }

  // -------------------------
  // PostsComponent
  // -------------------------
  class PostsComponent {
    constructor() {
      var windowDb = (typeof window.mockDatabase !== "undefined") ? window.mockDatabase : null;

      this.db = windowDb || { users: [], posts: [] };
      if (!this.db.users) this.db.users = [];
      if (!this.db.posts) this.db.posts = [];

      // Sync window.mockDatabase for pages that use it
      window.mockDatabase = this.db;

      // Prevent double-binding modal handlers across page rerenders
      this._commentSystemBound = false;

      this.refreshFromApi();

      window.addEventListener("animo:data-ready", (e) => {
        if (e && e.detail && e.detail.database) {
          this.db = e.detail.database;
          window.mockDatabase = this.db;
          this.syncActiveCommentModal();
          if (typeof window.triggerPostsUpdate === "function") {
            window.triggerPostsUpdate();
          }
        }
      });
    }

    async refreshFromApi() {
      if (typeof window.bootstrapMockDatabase !== "function") return;
      try {
        var latest = await window.bootstrapMockDatabase();
        if (latest && latest.users && latest.posts) {
          this.db = latest;
          window.mockDatabase = latest;
          this.syncActiveCommentModal();
        }
      } catch (error) {}
    }

    syncActiveCommentModal() {
      var modal = document.getElementById("post-view-modal");
      if (!modal || modal.style.display === "none") return;

      var postId = modal.getAttribute("data-post-id");
      if (!postId || typeof this.renderCommentsInModal !== "function") return;

      this.renderCommentsInModal(postId);
    }

    // ----- DB
    getDatabase() { return this.db; }

    persistDatabase() {
      window.mockDatabase = this.db;
    }

    // ----- Users / Posts
    getUsers() { return Array.isArray(this.db.users) ? this.db.users : []; }
    getPosts() { return Array.isArray(this.db.posts) ? this.db.posts : []; }

    getUserById(userId) {
      return this.getUsers().find(u => u && String(u.id) === String(userId)) || null;
    }

    getPostById(postId) {
      return this.getPosts().find(p => p && String(p.id) === String(postId)) || null;
    }

    // -------------------------
    // Post votes (per-user toggle)
    // -------------------------
    voteOnPost(postId, direction) {
      var post = this.getPostById(postId);
      if (!post) return false;

      var uid = getCurrentUserId();
      if (!uid) return false;

      // Ensure vote counts exist
      if (typeof post.upvotes !== "number") post.upvotes = 0;
      if (typeof post.downvotes !== "number") post.downvotes = 0;
      if (!post.votes || typeof post.votes !== "object") post.votes = {};

      var currentVote = post.votes[uid] || null;
      var newVote = null;

      // Determine new vote state based on current vote and direction
      if (direction === "up") {
        if (currentVote === "up") {
          // Clicking upvote again - remove the upvote
          newVote = null;
          post.upvotes = Math.max(0, post.upvotes - 1);
        } else if (currentVote === "down") {
          // Changing from downvote to upvote
          newVote = "up";
          post.downvotes = Math.max(0, post.downvotes - 1);
          post.upvotes = post.upvotes + 1;
        } else {
          // No previous vote - add upvote
          newVote = "up";
          post.upvotes = post.upvotes + 1;
        }
      } else if (direction === "down") {
        if (currentVote === "down") {
          // Clicking downvote again - remove the downvote
          newVote = null;
          post.downvotes = Math.max(0, post.downvotes - 1);
        } else if (currentVote === "up") {
          // Changing from upvote to downvote
          newVote = "down";
          post.upvotes = Math.max(0, post.upvotes - 1);
          post.downvotes = post.downvotes + 1;
        } else {
          // No previous vote - add downvote
          newVote = "down";
          post.downvotes = post.downvotes + 1;
        }
      }

      // Update user's vote
      if (newVote === null) {
        delete post.votes[uid];
      } else {
        post.votes[uid] = newVote;
      }

      if (newVote === "up") {
        post.lastUpvotedAt = nowTs();
      }

      post.lastInteraction = nowTs();
      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // POST: submit vote action for a post (up/down toggle)
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/vote", {
          method: "POST",
          body: JSON.stringify({ direction: direction })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    // -------------------------
    // Post Editing / Deletion
    // -------------------------
    editPost(postId, newTitle, newContent, newCategory, newCollege) {
      var post = this.getPostById(postId);
      if (!post) return false;

      var uid = getCurrentUserId();
      if (!uid || String(post.authorId) !== String(uid)) return false;

      var title = String(newTitle || "").trim();
      var content = String(newContent || "").trim();
      var category = String(newCategory || post.category || "").trim();
      var college = newCollege !== undefined ? String(newCollege).trim() : post.college;
      
      var contentChanged = title !== post.title || content !== post.content || category !== post.category || college !== post.college;

      post.title = title;
      post.content = content;
      post.category = category;
      post.college = college;
      
      if (contentChanged) {
        var now = new Date();
        post.lastEdited = now.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        });
      }
      post.lastInteraction = nowTs();

      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // PATCH: update post title/content/category
        window.apiRequest("/api/posts/" + encodeURIComponent(postId), {
          method: "PATCH",
          body: JSON.stringify({ title: post.title, content: post.content, category: post.category, college: post.college })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    deletePost(postId) {
      var uid = getCurrentUserId();
      if (!uid) return false;

      var postIndex = this.db.posts.findIndex(p => String(p.id) === String(postId));
      if (postIndex === -1) return false;

      var post = this.db.posts[postIndex];
      if (String(post.authorId) !== String(uid)) return false;

      this.db.posts.splice(postIndex, 1);
      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // DELETE: remove a post by ID
        window.apiRequest("/api/posts/" + encodeURIComponent(postId), {
          method: "DELETE"
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    // -------------------------
    // Views
    // -------------------------
    incrementViewCount(postId) {
      var post = this.getPostById(postId);
      if (!post) return false;
      post.views = (Number(post.views) || 0) + 1;
      post.lastInteraction = nowTs();
      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // GET: fetch post details while incrementing server-side view count
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "?incrementView=true", {
          method: "GET"
        }).then(() => {
          return this.refreshFromApi();
        }).then(() => {
          if (typeof window.triggerPostsUpdate === "function") {
            window.triggerPostsUpdate();
          }
        }).catch(() => {});
      }
      return true;
    }

    createPost(authorId, title, content, category, college) {
      var cat = String(category || "").trim().toLowerCase();
      if (!["discussion", "news", "help"].includes(cat)) cat = "discussion";

      var post = {
        id: "p" + Date.now(),
        authorId: authorId,
        category: cat,
        college: String(college || "").trim(),
        title: String(title || "").trim(),
        content: String(content || "").trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        upvotes: 0,
        downvotes: 0,
        views: 0,
        votes: {},
        comments: [],
        lastInteraction: nowTs()
      };

      this.db.posts.unshift(post);
      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // POST: create a new post
        window.apiRequest("/api/posts", {
          method: "POST",
          body: JSON.stringify({ title: post.title, content: post.content, category: post.category, college: post.college })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return post;
    }

    isLoggedIn() {
      return getCurrentUserId().length > 0;
    }

    getGuestFreePostCount() {
      return GUEST_FREE_POST_COUNT;
    }

    updateArticleVoteUI(articleEl, postId) {
      if (!articleEl) return;

      var post = this.getPostById(postId);
      if (!post) return;

      var voteCounts = articleEl.querySelector(".section-row span");
      if (voteCounts) {
        voteCounts.innerHTML =
          (Number(post.views) || 0) +
          " Views &#8226; ▲ " +
          (Number(post.upvotes) || 0) +
          " ▼ " +
          (Number(post.downvotes) || 0);
      }

      var currentUserId = getCurrentUserId();
      var userVote = (post.votes && currentUserId && post.votes[currentUserId]) ? post.votes[currentUserId] : null;
      var upBtn = articleEl.querySelector('[data-action="up"]');
      var downBtn = articleEl.querySelector('[data-action="down"]');

      if (upBtn) upBtn.setAttribute("data-active", userVote === "up" ? "1" : "0");
      if (downBtn) downBtn.setAttribute("data-active", userVote === "down" ? "1" : "0");
    }

    handlePostAction(event, options) {
      options = options || {};

      var target = event.target ? event.target.closest("[data-action][data-id]") : null;
      if (!target) return false;

      var action = target.getAttribute("data-action");
      var postId = target.getAttribute("data-id");
      if (!action || !postId) return false;

      if (!["up", "down", "open", "comment"].includes(action)) {
        return false;
      }

      var article = target.closest(".article");
      var isLocked = article && article.getAttribute("data-locked") === "1";

      if (!this.isLoggedIn() || isLocked) {
        AlertModal.show("Please login or sign up to view and interact with posts.", "error");
        event.preventDefault();
        event.stopPropagation();
        return true;
      }

      if (action === "up" || action === "down") {
        this.voteOnPost(postId, action);

        if (typeof options.onVote === "function") {
          options.onVote(postId, action, article);
        } else {
          this.updateArticleVoteUI(article, postId);
        }

        return true;
      }

      if (typeof window.openPostModal === "function") {
        window.openPostModal(postId);
      }
      return true;
    }

    ensureGlobalCreatePostUI() {
      if (document.getElementById("global-create-post-fab")) {
        this.syncGlobalCreatePostColor();
        return;
      }

      var fab = document.createElement("button");
      fab.id = "global-create-post-fab";
      fab.className = "global-create-post-fab poppins-extrabold";
      fab.type = "button";
      fab.setAttribute("data-label", "Add Post");
      fab.setAttribute("aria-label", "Create post");
      fab.textContent = "+";
      document.body.appendChild(fab);

      if (!document.getElementById("global-create-post-modal")) {
        var modal = document.createElement("div");
        modal.id = "global-create-post-modal";
        modal.className = "global-create-post-modal";
        modal.style.display = "none";
        modal.innerHTML =
          '<div class="global-create-post-backdrop">' +
            '<div class="global-create-post-card">' +
              '<button class="global-create-close" id="global-create-close" type="button">&times;</button>' +
              '<h2 class="poppins-extrabold">Create New Post</h2>' +
              '<div class="global-create-field">' +
                '<input type="text" id="global-create-title" class="global-create-input" placeholder="Post Title" maxlength="100" />' +
                '<div id="global-create-title-counter" class="global-create-counter poppins-regular">0 / 100</div>' +
              '</div>' +
              '<div class="global-create-field">' +
                '<textarea id="global-create-content" class="global-create-textarea" rows="6" placeholder="Write your post here..." maxlength="500"></textarea>' +
                '<div id="global-create-content-counter" class="global-create-counter poppins-regular">0 / 500</div>' +
              '</div>' +
              '<select id="global-create-category" class="global-create-input" style="margin-bottom: 15px;">' +
                '<option value="" disabled selected>Select Category</option>' +
                '<option value="discussion">Discussion</option>' +
                '<option value="news">News</option>' +
                '<option value="help">Help</option>' +
              '</select>' +
              '<select id="global-create-college" class="global-create-input" style="margin-bottom: 15px;">' +
                '<option value="">Select College (Optional)</option>' +
                '<option value="CLA">CLA</option>' +
                '<option value="SOE">SOE</option>' +
                '<option value="COS">COS</option>' +
                '<option value="GCOE">GCOE</option>' +
                '<option value="CCS">CCS</option>' +
                '<option value="RVRCOB">RVRCOB</option>' +
                '<option value="BAGCED">BAGCED</option>' +
                '<option value="SIS">SIS</option>' +
              '</select>' +
              '<button id="global-create-submit" class="global-create-submit poppins-extrabold" type="button">Publish Post</button>' +
            '</div>' +
          '</div>';

        document.body.appendChild(modal);

        var titleInput = document.getElementById("global-create-title");
        var titleCounter = document.getElementById("global-create-title-counter");
        if (titleInput && titleCounter) {
          titleInput.addEventListener("input", function() {
            titleCounter.textContent = titleInput.value.length + " / 100";
          });
        }
        
        var contentInput = document.getElementById("global-create-content");
        var contentCounter = document.getElementById("global-create-content-counter");
        if (contentInput && contentCounter) {
          contentInput.addEventListener("input", function() {
            contentCounter.textContent = contentInput.value.length + " / 500";
          });
        }
      }

      if (this._globalCreateUIBound) return;

      var self = this;
      var modalEl = document.getElementById("global-create-post-modal");
      var closeBtn = document.getElementById("global-create-close");
      var submitBtn = document.getElementById("global-create-submit");

      fab.addEventListener("click", function () {
        self.openGlobalCreatePostModal();
      });

      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          self.closeGlobalCreatePostModal();
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener("click", function () {
          self.submitGlobalCreatePost();
        });
      }

      if (modalEl) {
        modalEl.addEventListener("click", function (e) {
          if (e.target === modalEl || e.target.classList.contains("global-create-post-backdrop")) {
            self.closeGlobalCreatePostModal();
          }
        });
      }

      this.syncGlobalCreatePostColor();

      this._globalCreateUIBound = true;
    }

    syncGlobalCreatePostColor() {
      var fab = document.getElementById("global-create-post-fab");
      if (!fab) return;

      var color = "";
      var pageSection = document.querySelector(".page-section");
      if (pageSection) {
        color = getComputedStyle(pageSection).getPropertyValue("--page-color").trim();
      }

      if (!color) {
        color = "#5f764e";
      }

      fab.style.setProperty("--fab-color", color);
    }

    openGlobalCreatePostModal() {
      var currentUser = getCurrentUserId();
      if (!currentUser) {
        AlertModal.show("You must be logged in to create a post.", "error");
        return;
      }

      var modal = document.getElementById("global-create-post-modal");
      if (modal) modal.style.display = "flex";
    }

    closeGlobalCreatePostModal() {
      var modal = document.getElementById("global-create-post-modal");
      if (modal) modal.style.display = "none";
    }

    submitGlobalCreatePost() {
      var title = document.getElementById("global-create-title");
      var content = document.getElementById("global-create-content");
      var category = document.getElementById("global-create-category");
      var college = document.getElementById("global-create-college");
      if (!title || !content || !category) return;

      var titleVal = title.value.trim();
      var contentVal = content.value.trim();
      var categoryVal = category.value.trim();
      var collegeVal = college ? college.value.trim() : "";
      var currentUserId = getCurrentUserId();

      if (!currentUserId) {
        AlertModal.show("You must be logged in to create a post.", "error");
        return;
      }

      if (!titleVal) {
        AlertModal.show("Please enter a post title", "error");
        return;
      }

      if (!contentVal) {
        AlertModal.show("Please enter post content", "error");
        return;
      }

      if (!categoryVal) {
        AlertModal.show("Please select a category", "error");
        return;
      }

      this.createPost(currentUserId, titleVal, contentVal, categoryVal, collegeVal);

      title.value = "";
      content.value = "";
      category.value = "";
      if (college) college.value = "";
      
      var titleCounter = document.getElementById("global-create-title-counter");
      if (titleCounter) titleCounter.textContent = "0 / 100";
      var contentCounter = document.getElementById("global-create-content-counter");
      if (contentCounter) contentCounter.textContent = "0 / 500";

      this.closeGlobalCreatePostModal();

      AlertModal.show("Post created successfully!", "success");

      if (typeof window.triggerPostsUpdate === "function") {
        window.triggerPostsUpdate();
      } else {
        window.location.reload();
      }

      if (typeof window.updateProfileStats === "function") {
        window.updateProfileStats();
      }
    }

    // -------------------------
    // Sorting / filtering
    // -------------------------
    getFilteredPosts(opts) {
      opts = opts || {};
      var sortBy = String(opts.sortBy || "recent").toLowerCase();
      var category = (opts.category != null) ? String(opts.category).toLowerCase() : null;
      var authorId = (opts.authorId != null) ? String(opts.authorId) : null;
      var limit = (opts.limit != null) ? Number(opts.limit) : null;

      var posts = this.getPosts().slice();

      if (category) posts = posts.filter(p => String(p.category || "").toLowerCase() === category);
      if (authorId) posts = posts.filter(p => String(p.authorId || "") === authorId);

      if (sortBy === "hot") {
        posts = posts.filter((post) => getHotTimestamp(post) > 0);
        posts.sort((a, b) => {
          var hotA = getHotTimestamp(a);
          var hotB = getHotTimestamp(b);
          if (hotB !== hotA) return hotB - hotA;

          var scoreA = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
          var scoreB = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
          return scoreB - scoreA;
        });
      } else if (sortBy === "top") {
        posts.sort((a, b) => {
          var sa = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
          var sb = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
          return sb - sa;
        });
      } else if (sortBy === "trending") {
        posts.sort((a, b) => {
          var ia = Number(a.lastInteraction) || 0;
          var ib = Number(b.lastInteraction) || 0;
          var sa = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
          var sb = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
          return (ib + sb * 1000) - (ia + sa * 1000);
        });
      } else {
        // "recent" based on post.date string, fallback to lastInteraction
        posts.sort((a, b) => {
          var da = new Date(a.date || 0).getTime();
          var db = new Date(b.date || 0).getTime();
          if (isNaN(da)) da = Number(a.lastInteraction) || 0;
          if (isNaN(db)) db = Number(b.lastInteraction) || 0;
          return db - da;
        });
      }

      if (limit && !Number.isNaN(limit)) posts = posts.slice(0, limit);
      return posts;
    }

    // -------------------------
    // Rendering: Newspaper Article
    // -------------------------
    buildNewspaperArticle(post, index, locked) {
      var user = this.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };
      var upvotes = Number(post.upvotes) || 0;
      var downvotes = Number(post.downvotes) || 0;
      var isLead = (index === 0);
      
      // Count comments
      this.normalizeComments(post);
      var commentCount = (post.comments || []).length;

      // Check current user's vote
      var currentUserId = getCurrentUserId();
      var userVote = (post.votes && currentUserId && post.votes[currentUserId]) ? post.votes[currentUserId] : null;
      var upActive = (userVote === "up") ? ' data-active="1"' : "";
      var downActive = (userVote === "down") ? ' data-active="1"' : "";

      var el = document.createElement("article");
      el.className = "article" + (isLead ? " lead" : "") + (locked ? " locked" : "");
      el.setAttribute("data-id", post.id);
      el.setAttribute("data-locked", locked ? "1" : "0");
      el.setAttribute("data-category", String(post.category || "discussion").toLowerCase());
      el.setAttribute("data-college", String(post.college || ""));

      let tagsHtml = '<span>' + prettyCategory(post.category) + '</span>';
      if (post.college) {
        tagsHtml += ' <span>' + escapeHtml(prettyCollege(post.college)) + '</span>';
      }

      el.innerHTML =
        '<div class="post-author-header poppins-regular">' +
          '<img src="' + escapeHtml(user.photo) + '" alt="' + escapeHtml(user.username) + '" class="post-author-avatar">' +
          '<div class="post-author-info">' +
            '<a href="/profile?userId=' + escapeHtml(post.authorId) + '" class="post-author-username poppins-extrabold" style="color: #5f764e; text-decoration: none;">' + escapeHtml(user.username) + '</a>' +
            '<span class="post-author-date">' +
              escapeHtml(post.date || "") +
              (post.lastEdited ? ' &#8226; Edited ' + escapeHtml(post.lastEdited) : "") +
            '</span>' +
          '</div>' +
        '</div>' +
        '<h3 class="headline poppins-extrabold">' + escapeHtml(post.title || "") + '</h3>' +
        '<div class="section-row poppins-regular"><span>' +
          (Number(post.views) || 0) + ' Views &#8226; ▲ ' + upvotes + ' ▼ ' + downvotes +
        '</span></div>' +
        '<div class="rule"></div>' +
        '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, 180)) + '</p>' +
        '<div class="tags-mini">' + tagsHtml + '</div>' +
        '<div class="article-actions">' +
          '<div class="vote">' +
            '<button type="button" data-action="up" data-id="' + escapeHtml(post.id) + '"' + upActive + '>▲</button>' +
            '<button type="button" data-action="down" data-id="' + escapeHtml(post.id) + '"' + downActive + '>▼</button>' +
          '</div>' +
          '<div class="comment-view-actions">' +
            '<button type="button" class="comment-btn poppins-regular" data-action="comment" data-id="' + escapeHtml(post.id) + '" data-comment-count="' + commentCount + '">Comments (' + commentCount + ')</button>' +
            '<button type="button" class="open-btn poppins-extrabold" data-action="open" data-id="' + escapeHtml(post.id) + '">Open</button>' +
          '</div>' +
        '</div>';

      return el;
    }

    // -------------------------
    // COMMENTS: Data model
    // -------------------------
    normalizeComments(post) {
      post.comments = Array.isArray(post.comments) ? post.comments : [];

      post.comments = post.comments.map((c, idx) => {
        // Old format: string
        if (typeof c === "string") {
          return {
            id: makeId("c"),
            userId: "unknown",
            text: c,
            parentId: null,
            createdAt: nowTs(),
            editedAt: null,
            votes: {}
          };
        }

        // Old format: { userId, text, date }
        if (!c.id) c.id = makeId("c");
        c.id = normalizeId(c.id);
        c.userId = normalizeId(c.userId);
        if (!("parentId" in c)) c.parentId = null;
        else c.parentId = c.parentId == null ? null : normalizeId(c.parentId);

        if (!("createdAt" in c)) {
          // If they used `date` before, keep it but also add createdAt
          c.createdAt = c.date ? c.date : nowTs();
        }

        if (!("editedAt" in c)) {
          // If they used `lastEdited` before, map it
          c.editedAt = c.lastEdited ? c.lastEdited : null;
        }

        if (!c.votes || typeof c.votes !== "object") c.votes = {};
        if (!c.text) c.text = "";

        return c;
      });
    }

    getCommentScore(commentObj) {
      var votes = commentObj && commentObj.votes ? commentObj.votes : {};
      var score = 0;
      Object.keys(votes).forEach(uid => {
        if (votes[uid] === "up") score += 1;
        if (votes[uid] === "down") score -= 1;
      });
      return score;
    }

    getCommentTree(postId) {
      var post = this.getPostById(postId);
      if (!post) return [];

      this.normalizeComments(post);

      var byId = {};
      post.comments.forEach(c => {
        byId[c.id] = Object.assign({}, c, { replies: [] });
      });

      var roots = [];
      post.comments.forEach(c => {
        var node = byId[c.id];
        if (c.parentId && byId[c.parentId]) byId[c.parentId].replies.push(node);
        else roots.push(node);
      });

      // Optional: stable order (oldest-first within each thread)
      function sortThread(nodes) {
        nodes.sort((a, b) => {
          var ta = new Date(a.createdAt || 0).getTime();
          var tb = new Date(b.createdAt || 0).getTime();
          return ta - tb;
        });
        nodes.forEach(n => sortThread(n.replies || []));
      }
      sortThread(roots);

      return roots;
    }

    findComment(postId, commentId) {
      var post = this.getPostById(postId);
      if (!post) return null;
      this.normalizeComments(post);
      return post.comments.find(c => String(c.id) === String(commentId)) || null;
    }

    addComment(postId, userId, text) {
      var post = this.getPostById(postId);
      if (!post) return false;

      var cleaned = String(text || "").trim();
      if (!cleaned) return false;

      this.normalizeComments(post);

      post.comments.push({
        id: makeId("c"),
        userId: String(userId),
        text: cleaned,
        parentId: null,
        createdAt: nowTs(),
        editedAt: null,
        votes: {}
      });

      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // POST: add a top-level comment to a post
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/comments", {
          method: "POST",
          body: JSON.stringify({ text: cleaned })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    replyToComment(postId, parentId, userId, text) {
      var post = this.getPostById(postId);
      if (!post) return false;

      var cleaned = String(text || "").trim();
      if (!cleaned) return false;

      this.normalizeComments(post);

      post.comments.push({
        id: makeId("c"),
        userId: String(userId),
        text: cleaned,
        parentId: String(parentId),
        createdAt: nowTs(),
        editedAt: null,
        votes: {}
      });

      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // POST: add a reply comment under parentId
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/comments", {
          method: "POST",
          body: JSON.stringify({ text: cleaned, parentId: parentId })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    voteOnComment(postId, commentId, direction, userId) {
      var post = this.getPostById(postId);
      if (!post) return false;

      this.normalizeComments(post);

      var c = this.findComment(postId, commentId);
      if (!c) return false;

      var uid = String(userId);
      if (!c.votes || typeof c.votes !== "object") c.votes = {};

      var current = c.votes[uid] || null;

      if (direction === "up") c.votes[uid] = (current === "up") ? null : "up";
      else c.votes[uid] = (current === "down") ? null : "down";

      if (c.votes[uid] == null) delete c.votes[uid];

      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // POST: submit vote action for a comment (up/down toggle)
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/comments/" + encodeURIComponent(commentId) + "/vote", {
          method: "POST",
          body: JSON.stringify({ direction: direction })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    editComment(postId, commentId, userId, newText) {
      var post = this.getPostById(postId);
      if (!post) return false;

      this.normalizeComments(post);

      var c = this.findComment(postId, commentId);
      if (!c) return false;

      if (String(c.userId) !== String(userId)) return false;

      var cleaned = String(newText || "").trim();
      if (!cleaned) return false;

      if (cleaned === c.text) return true;

      c.text = cleaned;
      c.editedAt = nowTs();

      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // PATCH: update comment text
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/comments/" + encodeURIComponent(commentId), {
          method: "PATCH",
          body: JSON.stringify({ text: cleaned })
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    deleteComment(postId, commentId, userId) {
      var post = this.getPostById(postId);
      if (!post) return false;

      this.normalizeComments(post);

      var target = this.findComment(postId, commentId);
      if (!target) return false;
      if (String(target.userId) !== String(userId)) return false;

      // Delete target + descendants
      var toDelete = new Set([String(commentId)]);
      var changed = true;
      while (changed) {
        changed = false;
        post.comments.forEach(c => {
          if (c.parentId && toDelete.has(String(c.parentId)) && !toDelete.has(String(c.id))) {
            toDelete.add(String(c.id));
            changed = true;
          }
        });
      }

      post.comments = post.comments.filter(c => !toDelete.has(String(c.id)));
      this.persistDatabase();

      if (typeof window.apiRequest === "function") {
        // DELETE: remove a comment by ID
        window.apiRequest("/api/posts/" + encodeURIComponent(postId) + "/comments/" + encodeURIComponent(commentId), {
          method: "DELETE"
        }).then(() => this.refreshFromApi()).catch(() => {});
      }
      return true;
    }

    // -------------------------
    // COMMENTS: Modal binding + rendering (All pages)
    // -------------------------
    setupCommentSystem() {
      if (this._commentSystemBound) return;

      var modal = document.getElementById("post-view-modal");
      if (!modal) return;

      var commentsList = document.getElementById("comments-list");
      var commentCount = document.getElementById("comment-count");
      var submitBtn = document.getElementById("submit-comment-btn");
      var commentInput = document.getElementById("comment-input");

      if (!commentsList || !commentCount || !submitBtn || !commentInput) return;

      this.renderCommentsInModal = (postId) => {
        var post = this.getPostById(postId);
        if (!post) return;

        this.normalizeComments(post);

        commentCount.textContent = String((post.comments || []).length);
        commentsList.innerHTML = "";

        var tree = this.getCommentTree(postId);
        var currentUserId = getCurrentUserId();

        var renderNode = (node, depth) => {
          var wrapper = document.createElement("div");
          wrapper.className = "comment-item comment-item-thread";
          wrapper.style.marginLeft = (depth * 18) + "px";

          var user = this.getUserById(node.userId) || { username: "Unknown", photo: "assets/placeholder.png" };
          
          // Calculate upvote and downvote counts
          var upvotes = 0;
          var downvotes = 0;
          if (node.votes) {
            for (var uid in node.votes) {
              if (node.votes[uid] === "up") upvotes++;
              if (node.votes[uid] === "down") downvotes++;
            }
          }
          
          var isOwner = currentUserId && String(currentUserId) === String(node.userId);

          var createdLabel = formatTs(node.createdAt);
          var editedIndicator = node.editedAt ? (" • edited") : ""; // indicator
          var editedTs = node.editedAt ? (" (" + formatTs(node.editedAt) + ")") : "";

          var myVote = (currentUserId && node.votes && node.votes[currentUserId]) ? node.votes[currentUserId] : null;
          var upActive = (myVote === "up") ? ' data-active="1"' : "";
          var downActive = (myVote === "down") ? ' data-active="1"' : "";
          var ownerMenu = isOwner
            ? (
              '<div class="owner-action-menu owner-action-menu--comment">' +
                '<button type="button" class="owner-action-trigger" data-action="c_menu_toggle" data-cid="' + escapeHtml(node.id) + '" aria-label="Comment actions">&#8942;</button>' +
                '<div class="owner-action-dropdown" data-owner-menu="' + escapeHtml(node.id) + '" style="display:none;">' +
                  '<button type="button" class="owner-action-item" data-action="c_edit_toggle" data-cid="' + escapeHtml(node.id) + '">Edit</button>' +
                  '<button type="button" class="owner-action-item owner-action-item-delete" data-action="c_delete" data-cid="' + escapeHtml(node.id) + '">Delete</button>' +
                '</div>' +
              '</div>'
            )
            : "";

          // Check if this is a reply and get parent user info
          var replyToText = "";
          if (node.parentId) {
            var parentComment = this.findComment(postId, node.parentId);
            if (parentComment) {
              var parentUser = this.getUserById(parentComment.userId) || { username: "Unknown" };
              replyToText = '<span style="color:#888; font-size:11px; font-style:italic;"> replied to <a href="/profile?userId=' + escapeHtml(parentComment.userId) + '" style="color:#888; text-decoration: underline;">' + escapeHtml(parentUser.username) + '</a></span>';
            }
          }

          wrapper.innerHTML =
            ownerMenu +
            '<div class="comment-header poppins-regular" style="display:flex; align-items:center; gap:10px;">' +
              '<img src="' + escapeHtml(user.photo || "assets/placeholder.png") + '" ' +
                   'alt="' + escapeHtml(user.username) + '" ' +
                   'style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">' +
              '<div style="display:flex; flex-direction:column; gap:2px;">' +
                '<a href="/profile?userId=' + escapeHtml(node.userId) + '" class="comment-author poppins-extrabold" style="color: #5f764e; text-decoration: none;">' + escapeHtml(user.username) + '</a>' + replyToText +
                '<span class="comment-date">' + escapeHtml(createdLabel + editedIndicator + editedTs) + '</span>' +
              '</div>' +
            '</div>' +

            '<p class="comment-text poppins-regular" style="margin-top:10px;">' + escapeHtml(node.text) + '</p>' +

            '<div class="comment-actions" style="display:flex; gap:10px; align-items:center; margin-top:10px; flex-wrap:wrap;">' +
              '<button type="button" data-action="c_up" data-cid="' + escapeHtml(node.id) + '"' + upActive + '>▲</button>' +
              '<span class="poppins-regular">' + upvotes + '</span>' +
              '<button type="button" data-action="c_down" data-cid="' + escapeHtml(node.id) + '"' + downActive + '>▼</button>' +
              '<span class="poppins-regular">' + downvotes + '</span>' +
              '<button type="button" class="poppins-regular" data-action="c_reply_toggle" data-cid="' + escapeHtml(node.id) + '">Reply</button>' +
            '</div>' +

            '<div data-replybox="' + escapeHtml(node.id) + '" style="display:none; margin-top:10px;">' +
              '<textarea class="comment-textarea" rows="2" placeholder="Write a reply..."></textarea>' +
              '<button type="button" class="submit-comment-btn poppins-extrabold" data-action="c_reply_submit" data-cid="' + escapeHtml(node.id) + '" style="margin-top:8px;">Reply</button>' +
            '</div>' +

            '<div data-editbox="' + escapeHtml(node.id) + '" style="display:none; margin-top:10px;">' +
              '<textarea class="comment-textarea" rows="2">' + escapeHtml(node.text) + '</textarea>' +
              '<div style="display:flex; gap:10px; margin-top:8px;">' +
                '<button type="button" class="submit-comment-btn poppins-extrabold" data-action="c_edit_save" data-cid="' + escapeHtml(node.id) + '">Save</button>' +
                '<button type="button" class="submit-comment-btn poppins-extrabold" data-action="c_edit_cancel" data-cid="' + escapeHtml(node.id) + '" style="background:#504e76;">Cancel</button>' +
              '</div>' +
            '</div>';

          commentsList.appendChild(wrapper);

          (node.replies || []).forEach(r => renderNode(r, depth + 1));
        };

        tree.forEach(n => renderNode(n, 0));
      };

      // Submit top-level comment (Logged-in users can comment anywhere, including own posts)
      submitBtn.addEventListener("click", () => {
        var postId = modal.getAttribute("data-post-id");
        var uid = getCurrentUserId();
        var text = (commentInput.value || "").trim();

        if (!uid) {
          AlertModal.show("Please login to add comments.", "error");
          return;
        }
        if (!text) {
          AlertModal.show("Comment cannot be empty.", "error");
          return;
        }

        var ok = this.addComment(postId, uid, text);
        if (!ok) {
          AlertModal.show("Comment cannot be empty.", "error");
          return;
        }

        commentInput.value = "";
        this.renderCommentsInModal(postId);
        AlertModal.show("Comment posted!", "success");
        
        // Trigger update of post list to refresh comment counts
        if (typeof window.triggerPostsUpdate === "function") {
          window.triggerPostsUpdate();
        }
      });

      // Comment actions (vote, reply, edit, delete)
      commentsList.addEventListener("click", (e) => {
        var btn = e.target.closest("button");
        if (!btn) return;

        var action = btn.getAttribute("data-action");
        var cid = btn.getAttribute("data-cid");
        if (!action || !cid) return;

        var postId = modal.getAttribute("data-post-id");
        var uid = getCurrentUserId();

        if (action === "c_menu_toggle") {
          e.stopPropagation();
          var menu = commentsList.querySelector('[data-owner-menu="' + cid + '"]');
          toggleOwnerActionMenu(commentsList, menu);
          return;
        }

        if (!uid) {
          AlertModal.show("Please login to interact with comments.", "error");
          return;
        }

        if (action === "c_up") {
          this.voteOnComment(postId, cid, "up", uid);
          this.renderCommentsInModal(postId);
          return;
        }

        if (action === "c_down") {
          this.voteOnComment(postId, cid, "down", uid);
          this.renderCommentsInModal(postId);
          return;
        }

        if (action === "c_reply_toggle") {
          closeOwnerActionMenus(commentsList);
          var box = commentsList.querySelector('[data-replybox="' + cid + '"]');
          if (box) box.style.display = (box.style.display === "none" ? "block" : "none");
          return;
        }

        if (action === "c_reply_submit") {
          var rbox = commentsList.querySelector('[data-replybox="' + cid + '"]');
          var ta = rbox ? rbox.querySelector("textarea") : null;
          var txt = (ta ? ta.value : "").trim();

          if (!txt) {
            AlertModal.show("Reply cannot be empty.", "error");
            return;
          }

          this.replyToComment(postId, cid, uid, txt);
          if (ta) ta.value = "";
          this.renderCommentsInModal(postId);
          AlertModal.show("Reply posted!", "success");
          
          // Trigger update of post list to refresh comment counts
          if (typeof window.triggerPostsUpdate === "function") {
            window.triggerPostsUpdate();
          }
          return;
        }

        if (action === "c_edit_toggle") {
          closeOwnerActionMenus(commentsList);
          var ebox = commentsList.querySelector('[data-editbox="' + cid + '"]');
          if (ebox) ebox.style.display = (ebox.style.display === "none" ? "block" : "none");
          return;
        }

        if (action === "c_edit_cancel") {
          var ebox2 = commentsList.querySelector('[data-editbox="' + cid + '"]');
          if (ebox2) ebox2.style.display = "none";
          return;
        }

        if (action === "c_edit_save") {
          var ebox3 = commentsList.querySelector('[data-editbox="' + cid + '"]');
          var ta2 = ebox3 ? ebox3.querySelector("textarea") : null;
          var next = (ta2 ? ta2.value : "").trim();

          if (!next) {
            AlertModal.show("Edited comment cannot be empty.", "error");
            return;
          }

          var ok3 = this.editComment(postId, cid, uid, next);
          if (!ok3) {
            AlertModal.show("You can only edit your own comment.", "error");
            return;
          }

          this.renderCommentsInModal(postId);
          AlertModal.show("Comment updated!", "success");
          return;
        }

        if (action === "c_delete") {
          closeOwnerActionMenus(commentsList);
          var runDelete = () => {
            var ok4 = this.deleteComment(postId, cid, uid);
            if (!ok4) {
              AlertModal.show("You can only delete your own comment.", "error");
              return;
            }

            this.renderCommentsInModal(postId);
            AlertModal.show("Comment deleted.", "success");
            
            // Trigger update of post list to refresh comment counts
            if (typeof window.triggerPostsUpdate === "function") {
              window.triggerPostsUpdate();
            }
          };

          if (typeof AlertModal !== "undefined" && typeof AlertModal.confirm === "function") {
            AlertModal.confirm("Delete this comment? Replies under it will also be deleted.", runDelete);
          } else {
            var sure = confirm("Delete this comment? Replies under it will also be deleted.");
            if (sure) runDelete();
          }
          return;
        }
      });

      if (!this._ownerMenuCloseBound) {
        document.addEventListener("click", function (e) {
          if (!e.target.closest(".owner-action-menu")) {
            closeOwnerActionMenus(document);
          }
        });
        this._ownerMenuCloseBound = true;
      }

      this._commentSystemBound = true;
    }
  }

  // -------------------------
  // Global instance
  // -------------------------
  window.PostsComponent_Instance = new PostsComponent();

  function initGlobalPostCreationUI() {
    if (window.PostsComponent_Instance && typeof window.PostsComponent_Instance.ensureGlobalCreatePostUI === "function") {
      window.PostsComponent_Instance.ensureGlobalCreatePostUI();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalPostCreationUI);
  } else {
    initGlobalPostCreationUI();
  }

  window.openCreatePostModal = function () {
    if (!window.PostsComponent_Instance) return;
    window.PostsComponent_Instance.openGlobalCreatePostModal();
  };

  window.closeCreatePostModal = function () {
    if (!window.PostsComponent_Instance) return;
    window.PostsComponent_Instance.closeGlobalCreatePostModal();
  };

  window.submitNewPost = function () {
    if (!window.PostsComponent_Instance) return;
    window.PostsComponent_Instance.submitGlobalCreatePost();
  };

  // -------------------------
  // Global Modal Functions (All Pages)
  // -------------------------
  function renderPostModalContent(postId) {
    var post = window.PostsComponent_Instance.getPostById(postId);
    if (!post) return;

    var modalContent = document.getElementById("modal-post-content");
    if (!modalContent) return;

    var user = window.PostsComponent_Instance.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };
    var currentUserId = getCurrentUserId();
    var isOwner = currentUserId && String(currentUserId) === String(post.authorId);

    modalContent.innerHTML =
      '<div class="post-modal-shell">' +
        (isOwner
          ? (
            '<div class="owner-action-menu owner-action-menu--post">' +
              '<button type="button" class="owner-action-trigger" data-post-action="menu_toggle" aria-label="Post actions">&#8942;</button>' +
              '<div class="owner-action-dropdown" data-post-menu style="display:none;">' +
                '<button type="button" class="owner-action-item" data-post-action="edit_toggle">Edit</button>' +
                '<button type="button" class="owner-action-item owner-action-item-delete" data-post-action="delete">Delete</button>' +
              '</div>' +
            '</div>'
          )
          : "") +
        '<div class="post-author-header poppins-regular">' +
          '<img src="' + escapeHtml(user.photo) + '" alt="' + escapeHtml(user.username) + '" class="post-author-avatar">' +
          '<div class="post-author-info">' +
            '<span class="post-author-username poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
            '<span class="post-author-date">' +
              escapeHtml(post.date || "") +
              (post.lastEdited ? ' &#8226; Edited ' + escapeHtml(post.lastEdited) : "") +
            '</span>' +
          '</div>' +
        '</div>' +
        '<h2 class="headline poppins-extrabold">' + escapeHtml(post.title || "") + '</h2>' +
        '<div class="section-row poppins-regular">' +
          '<span>' + (Number(post.views) || 0) + ' Views &#8226; &#9650; ' +
            (Number(post.upvotes) || 0) + ' &#9660; ' + (Number(post.downvotes) || 0) +
          '</span>' +
        '</div>' +
        '<div class="rule"></div>' +
        '<p class="excerpt poppins-regular">' + escapeHtml(post.content || "") + '</p>' +
        '<div class="tags-mini">' +
          '<span>' + prettyCategory(post.category) + '</span>' +
          (post.college ? '<span>' + escapeHtml(prettyCollege(post.college)) + '</span>' : '') +
        '</div>' +
        (isOwner
          ? (
            '<div data-post-edit-box style="display:none; margin-top:12px;">' +
              '<div style="position: relative;">' +
                '<input type="text" data-post-edit-title class="comment-textarea" style="min-height:auto; margin-bottom:8px;" value="' + escapeHtml(post.title || "") + '" maxlength="100">' +
                '<div data-post-title-counter class="poppins-regular" style="font-size: 11px; color: #777; text-align: right; margin-top: -8px; margin-bottom: 10px; margin-right: 5px;">' + (post.title || "").length + ' / 100</div>' +
              '</div>' +
              '<div style="position: relative;">' +
                '<textarea data-post-edit-content class="comment-textarea" rows="5" maxlength="500">' + escapeHtml(post.content || "") + '</textarea>' +
                '<div data-post-content-counter class="poppins-regular" style="font-size: 11px; color: #777; text-align: right; margin-top: -8px; margin-bottom: 10px; margin-right: 5px;">' + (post.content || "").length + ' / 500</div>' +
              '</div>' +
              '<select data-post-edit-category class="comment-textarea" style="min-height: auto; margin-bottom: 15px; width: 100%;">' +
                '<option value="" disabled' + (!post.category ? ' selected' : '') + '>Select Category</option>' +
                '<option value="discussion"' + (post.category === 'discussion' ? ' selected' : '') + '>Discussion</option>' +
                '<option value="news"' + (post.category === 'news' ? ' selected' : '') + '>News</option>' +
                '<option value="help"' + (post.category === 'help' ? ' selected' : '') + '>Help</option>' +
              '</select>' +
              '<select data-post-edit-college class="comment-textarea" style="min-height: auto; margin-bottom: 15px; width: 100%;">' +
                '<option value=""' + (!post.college ? ' selected' : '') + '>Select College (Optional)</option>' +
                '<option value="CLA"' + (post.college === 'CLA' ? ' selected' : '') + '>CLA</option>' +
                '<option value="SOE"' + (post.college === 'SOE' ? ' selected' : '') + '>SOE</option>' +
                '<option value="COS"' + (post.college === 'COS' ? ' selected' : '') + '>COS</option>' +
                '<option value="GCOE"' + (post.college === 'GCOE' ? ' selected' : '') + '>GCOE</option>' +
                '<option value="CCS"' + (post.college === 'CCS' ? ' selected' : '') + '>CCS</option>' +
                '<option value="RVRCOB"' + (post.college === 'RVRCOB' ? ' selected' : '') + '>RVRCOB</option>' +
                '<option value="BAGCED"' + (post.college === 'BAGCED' ? ' selected' : '') + '>BAGCED</option>' +
                '<option value="SIS"' + (post.college === 'SIS' ? ' selected' : '') + '>SIS</option>' +
              '</select>' +
              '<div style="display:flex; gap:8px; margin-top:8px;">' +
                '<button type="button" class="submit-comment-btn poppins-extrabold" data-post-action="edit_save">Save Changes</button>' +
                '<button type="button" class="submit-comment-btn poppins-extrabold" data-post-action="edit_cancel" style="background:#504e76;">Cancel</button>' +
              '</div>' +
            '</div>'
          )
          : "") +
      '</div>';

    if (!isOwner) return;

    var editBox = modalContent.querySelector("[data-post-edit-box]");
    var menuToggleBtn = modalContent.querySelector('[data-post-action="menu_toggle"]');
    var menuDropdown = modalContent.querySelector("[data-post-menu]");
    var editToggleBtn = modalContent.querySelector('[data-post-action="edit_toggle"]');
    var editCancelBtn = modalContent.querySelector('[data-post-action="edit_cancel"]');
    var editSaveBtn = modalContent.querySelector('[data-post-action="edit_save"]');
    var deleteBtn = modalContent.querySelector('[data-post-action="delete"]');
    
    var titleEditInput = modalContent.querySelector("[data-post-edit-title]");
    var contentEditInput = modalContent.querySelector("[data-post-edit-content]");
    var titleCounterLabel = modalContent.querySelector("[data-post-title-counter]");
    var contentCounterLabel = modalContent.querySelector("[data-post-content-counter]");
    
    if (titleEditInput && titleCounterLabel) {
      titleEditInput.addEventListener("input", function() {
        titleCounterLabel.textContent = titleEditInput.value.length + " / 100";
      });
    }
    if (contentEditInput && contentCounterLabel) {
      contentEditInput.addEventListener("input", function() {
        contentCounterLabel.textContent = contentEditInput.value.length + " / 500";
      });
    }

    if (menuToggleBtn && menuDropdown) {
      menuToggleBtn.onclick = function (e) {
        e.stopPropagation();
        toggleOwnerActionMenu(modalContent, menuDropdown);
      };
    }

    if (editToggleBtn && editBox) {
      editToggleBtn.onclick = function () {
        closeOwnerActionMenus(modalContent);
        editBox.style.display = editBox.style.display === "none" ? "block" : "none";
      };
    }

    if (editCancelBtn && editBox) {
      editCancelBtn.onclick = function () {
        editBox.style.display = "none";
      };
    }

    if (deleteBtn) {
      deleteBtn.onclick = function () {
        closeOwnerActionMenus(modalContent);

        var runDelete = function () {
          var okDelete = window.PostsComponent_Instance.deletePost(postId);
          if (!okDelete) {
            AlertModal.show("You can only delete your own post.", "error");
            return;
          }

          window.closePostModal();
          if (typeof window.triggerPostsUpdate === "function") {
            window.triggerPostsUpdate();
          }
          if (typeof window.updateProfileStats === "function") {
            window.updateProfileStats();
          }
          AlertModal.show("Post deleted!", "success");
        };

        if (typeof AlertModal !== "undefined" && typeof AlertModal.confirm === "function") {
          AlertModal.confirm("Delete this post? This action cannot be undone.", runDelete);
        } else {
          var sure = confirm("Delete this post? This action cannot be undone.");
          if (sure) runDelete();
        }
      };
    }

    if (editSaveBtn) {
      editSaveBtn.onclick = function () {
        var nextTitleEl = modalContent.querySelector("[data-post-edit-title]");
        var nextContentEl = modalContent.querySelector("[data-post-edit-content]");
        var nextCategoryEl = modalContent.querySelector("[data-post-edit-category]");
        var nextCollegeEl = modalContent.querySelector("[data-post-edit-college]");

        var nextTitle = nextTitleEl ? String(nextTitleEl.value || "").trim() : "";
        var nextContent = nextContentEl ? String(nextContentEl.value || "").trim() : "";
        var nextCategory = nextCategoryEl ? nextCategoryEl.value.trim() : (post.category || "");
        var nextCollege = nextCollegeEl ? nextCollegeEl.value.trim() : (post.college || "");

        if (!nextTitle) {
          AlertModal.show("Title cannot be empty", "error");
          return;
        }
        if (!nextContent) {
          AlertModal.show("Content cannot be empty", "error");
          return;
        }

        var ok = window.PostsComponent_Instance.editPost(postId, nextTitle, nextContent, nextCategory, nextCollege);
        if (!ok) {
          AlertModal.show("You can only edit your own post.", "error");
          return;
        }

        renderPostModalContent(postId);
        if (typeof window.PostsComponent_Instance.renderCommentsInModal === "function") {
          window.PostsComponent_Instance.renderCommentsInModal(postId);
        }
        if (typeof window.triggerPostsUpdate === "function") {
          window.triggerPostsUpdate();
        }
        AlertModal.show("Post updated!", "success");
      };
    }
  }

  window.openPostModal = function (postId) {
    var post = window.PostsComponent_Instance.getPostById(postId);
    if (!post) return;

    var modal = document.getElementById("post-view-modal");
    if (!modal) return;

    // Modal partial is mounted outside .page-section, so copy page color at open time.
    var section = document.querySelector(".page-section");
    if (section && typeof window.getComputedStyle === "function") {
      var sectionPageColor = window.getComputedStyle(section).getPropertyValue("--page-color").trim();
      if (sectionPageColor) {
        modal.style.setProperty("--page-color", sectionPageColor);
      }
    }

    // Always count a view when opening full post
    window.PostsComponent_Instance.incrementViewCount(postId);

    if (typeof window.triggerPostsUpdate === "function") {
      window.triggerPostsUpdate();
    }

    renderPostModalContent(postId);

    modal.style.display = "flex";
    modal.setAttribute("data-post-id", postId);

    // Bind comment system once, then render
    window.PostsComponent_Instance.setupCommentSystem();
    if (typeof window.PostsComponent_Instance.renderCommentsInModal === "function") {
      window.PostsComponent_Instance.renderCommentsInModal(postId);
    }

    // Backdrop click close
    var backdrop = modal.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.onclick = function (e) {
        if (e.target === backdrop) window.closePostModal();
      };
    }
  };

  window.closePostModal = function () {
    var modal = document.getElementById("post-view-modal");
    if (modal) modal.style.display = "none";
  };
})();
