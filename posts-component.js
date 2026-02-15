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
  // -------------------------
  // Utilities
  // -------------------------
  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
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
    var c = String(cat || "").toLowerCase();
    if (c === "news") return "News";
    if (c === "help") return "Help";
    return "Discussion";
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

  function getCurrentUserId() {
    return (localStorage.getItem("currentUserId") || "").trim();
  }

  function makeId(prefix) {
    return prefix + "_" + nowTs() + "_" + Math.floor(Math.random() * 999999);
  }

  // -------------------------
  // PostsComponent
  // -------------------------
  class PostsComponent {
    constructor() {
      var localDb = safeParse(localStorage.getItem("mockDatabase"));
      var windowDb = (typeof window.mockDatabase !== "undefined") ? window.mockDatabase : null;

      this.db = localDb || windowDb || { users: [], posts: [] };
      if (!this.db.users) this.db.users = [];
      if (!this.db.posts) this.db.posts = [];

      // Sync window.mockDatabase for pages that use it
      window.mockDatabase = this.db;

      // Prevent double-binding modal handlers across page rerenders
      this._commentSystemBound = false;
    }

    // ----- DB
    getDatabase() { return this.db; }

    persistDatabase() {
      try { localStorage.setItem("mockDatabase", JSON.stringify(this.db)); }
      catch (e) {}
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

      if (!post.votes || typeof post.votes !== "object") post.votes = {};
      var current = post.votes[uid] || null;

      if (direction === "up") post.votes[uid] = (current === "up") ? null : "up";
      else post.votes[uid] = (current === "down") ? null : "down";

      if (post.votes[uid] == null) delete post.votes[uid];

      var up = 0, down = 0;
      Object.keys(post.votes).forEach(k => {
        if (post.votes[k] === "up") up++;
        if (post.votes[k] === "down") down++;
      });
      post.upvotes = up;
      post.downvotes = down;
      post.lastInteraction = nowTs();

      this.persistDatabase();
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
      return true;
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
        posts.sort((a, b) => {
          var sa = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
          var sb = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
          var va = Number(a.views) || 0;
          var vb = Number(b.views) || 0;
          var ia = Number(a.lastInteraction) || 0;
          var ib = Number(b.lastInteraction) || 0;

          var hotA = sa * 4 + va * 0.02 + ia * 0.00000005;
          var hotB = sb * 4 + vb * 0.02 + ib * 0.00000005;
          return hotB - hotA;
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
      var score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);
      var isLead = (index === 0);

      var el = document.createElement("article");
      el.className = "article" + (isLead ? " lead" : "") + (locked ? " locked" : "");
      el.setAttribute("data-id", post.id);
      el.setAttribute("data-locked", locked ? "1" : "0");
      el.setAttribute("data-category", String(post.category || "discussion").toLowerCase());

      el.innerHTML =
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
        '<h3 class="headline poppins-extrabold">' + escapeHtml(post.title || "") + '</h3>' +
        '<div class="section-row poppins-regular"><span>' +
          (Number(post.views) || 0) + ' Views &#8226; Score ' + score +
        '</span></div>' +
        '<div class="rule"></div>' +
        '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, 180)) + '</p>' +
        '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>' +
        '<div class="article-actions">' +
          '<div class="vote">' +
            '<button type="button" data-action="up" data-id="' + escapeHtml(post.id) + '">▲</button>' +
            '<button type="button" data-action="down" data-id="' + escapeHtml(post.id) + '">▼</button>' +
          '</div>' +
          '<div class="comment-view-actions">' +
            '<button type="button" class="comment-btn poppins-regular" data-action="comment" data-id="' + escapeHtml(post.id) + '">Comment</button>' +
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
        if (!("parentId" in c)) c.parentId = null;

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

      c.text = cleaned;
      c.editedAt = nowTs();

      this.persistDatabase();
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
          wrapper.className = "comment-item";
          wrapper.style.marginLeft = (depth * 18) + "px";

          var user = this.getUserById(node.userId) || { username: "Unknown", photo: "assets/placeholder.png" };
          var score = this.getCommentScore(node);
          var isOwner = currentUserId && String(currentUserId) === String(node.userId);

          var createdLabel = formatTs(node.createdAt);
          var editedIndicator = node.editedAt ? (" • edited") : ""; // indicator
          var editedTs = node.editedAt ? (" (" + formatTs(node.editedAt) + ")") : "";

          var myVote = (currentUserId && node.votes && node.votes[currentUserId]) ? node.votes[currentUserId] : null;
          var upActive = (myVote === "up") ? ' data-active="1"' : "";
          var downActive = (myVote === "down") ? ' data-active="1"' : "";

          wrapper.innerHTML =
            '<div class="comment-header poppins-regular" style="display:flex; align-items:center; gap:10px;">' +
              '<img src="' + escapeHtml(user.photo || "assets/placeholder.png") + '" ' +
                   'alt="' + escapeHtml(user.username) + '" ' +
                   'style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">' +
              '<div style="display:flex; flex-direction:column; gap:2px;">' +
                '<span class="comment-author poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
                '<span class="comment-date">' + escapeHtml(createdLabel + editedIndicator + editedTs) + '</span>' +
              '</div>' +
            '</div>' +

            '<p class="comment-text poppins-regular" style="margin-top:10px;">' + escapeHtml(node.text) + '</p>' +

            '<div class="comment-actions" style="display:flex; gap:10px; align-items:center; margin-top:10px; flex-wrap:wrap;">' +
              '<button type="button" data-action="c_up" data-cid="' + escapeHtml(node.id) + '"' + upActive + '>▲</button>' +
              '<button type="button" data-action="c_down" data-cid="' + escapeHtml(node.id) + '"' + downActive + '>▼</button>' +
              '<span class="poppins-regular">Score ' + score + '</span>' +
              '<button type="button" class="poppins-regular" data-action="c_reply_toggle" data-cid="' + escapeHtml(node.id) + '">Reply</button>' +
              (isOwner
                ? (
                  '<button type="button" class="poppins-regular" data-action="c_edit_toggle" data-cid="' + escapeHtml(node.id) + '">Edit</button>' +
                  '<button type="button" class="poppins-regular" data-action="c_delete" data-cid="' + escapeHtml(node.id) + '">Delete</button>'
                )
                : "") +
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
          return;
        }

        if (action === "c_edit_toggle") {
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
          var sure = confirm("Delete this comment? Replies under it will also be deleted.");
          if (!sure) return;

          var ok4 = this.deleteComment(postId, cid, uid);
          if (!ok4) {
            AlertModal.show("You can only delete your own comment.", "error");
            return;
          }

          this.renderCommentsInModal(postId);
          AlertModal.show("Comment deleted.", "success");
          return;
        }
      });

      this._commentSystemBound = true;
    }
  }

  // -------------------------
  // Global instance
  // -------------------------
  window.PostsComponent_Instance = new PostsComponent();

  // -------------------------
  // Global Modal Functions (All Pages)
  // -------------------------
  window.openPostModal = function (postId) {
    var post = window.PostsComponent_Instance.getPostById(postId);
    if (!post) return;

    var modal = document.getElementById("post-view-modal");
    var modalContent = document.getElementById("modal-post-content");
    if (!modal || !modalContent) return;

    // Always count a view when opening full post
    window.PostsComponent_Instance.incrementViewCount(postId);

    var user = window.PostsComponent_Instance.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };
    var score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);

    modalContent.innerHTML =
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
          ' &#8226; Score ' + score +
        '</span>' +
      '</div>' +
      '<div class="rule"></div>' +
      '<p class="excerpt poppins-regular">' + escapeHtml(post.content || "") + '</p>' +
      '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';

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
