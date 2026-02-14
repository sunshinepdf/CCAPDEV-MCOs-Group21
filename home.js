document.addEventListener("DOMContentLoaded", function () {
  var paperGrid = document.getElementById("paperGrid");
  var popularPreview = document.getElementById("popularPreview");
  var discoverPreview = document.getElementById("discoverPreview");
  var viewMoreGate = document.getElementById("viewMoreGate");
  var loginStatus = document.getElementById("loginStatus");
  var profileLink = document.getElementById("profileLink");
  var mastheadDate = document.getElementById("mastheadDate");

  function safeParse(value) {
    try { return value ? JSON.parse(value) : null; }
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

  function excerpt(text, n) {
    var t = String(text || "").trim().replace(/\s+/g, " ");
    if (t.length <= n) return t;
    return t.slice(0, n).trim() + "…";
  }

  function parseDateSafe(dateStr) {
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return new Date(0);
  }

  function isLoggedIn() {
    return !!localStorage.getItem("currentUserId");
  }

  function getCurrentUserId() {
    return localStorage.getItem("currentUserId") || "";
  }

  function getDatabase() {
    var localDb = safeParse(localStorage.getItem("mockDatabase"));
    if (localDb && typeof localDb === "object") return localDb;
    if (typeof mockDatabase !== "undefined") return mockDatabase;
    return { users: [], posts: [] };
  }

  function saveDatabase(db) {
    localStorage.setItem("mockDatabase", JSON.stringify(db));
  }

 
  function seedPostsIfEmpty(db) {
    if (!db.posts || !Array.isArray(db.posts)) db.posts = [];
    if (db.posts.length >= 15) return;

    var defaultAuthorId = (db.users && db.users[0] && db.users[0].id) ? db.users[0].id : "u1";

    var seed = [];
    for (var i = 1; i <= 20; i++) {
      var cat = (i % 3 === 0) ? "help" : (i % 2 === 0) ? "news" : "discussion";
      seed.push({
        id: "hp" + i,
        authorId: defaultAuthorId,
        category: cat,
        title: (cat === "news" ? "News: " : cat === "help" ? "Help: " : "Discussion: ") + "Post " + i,
        content: "Sample post content for Home page seeding. Replace this later with real content. This ensures 15–20 posts display.",
        date: "Feb " + (10 - (i % 9)) + ", 2026",
        views: 80 + i * 9,
        upvotes: 3 + (i % 7),
        downvotes: (i % 4)
      });
    }

    db.posts = seed;
    saveDatabase(db);
  }

  function getAuthorName(db, authorId) {
    if (!db.users || !Array.isArray(db.users)) return "Anonymous";
    var u = db.users.find(function (x) { return x && x.id === authorId; });
    return u ? (u.username || "Anonymous") : "Anonymous";
  }

  function prettyCategory(cat) {
    var c = String(cat || "").toLowerCase();
    if (c === "news") return "News";
    if (c === "help") return "Help";
    return "Discussion";
  }

  
  function getUserVotesKey(userId) {
    return "votes_" + userId;
  }

  function getUserVotes(userId) {
    return safeParse(localStorage.getItem(getUserVotesKey(userId))) || {};
  }

  function saveUserVotes(userId, votes) {
    localStorage.setItem(getUserVotesKey(userId), JSON.stringify(votes));
  }

  function applyVote(db, postId, dir) {
    var userId = getCurrentUserId();
    var votes = getUserVotes(userId);

    var prev = Number(votes[postId] || 0);
    var next = (prev === dir) ? 0 : dir;

    var post = db.posts.find(function (p) { return p && p.id === postId; });
    if (!post) return;

    if (prev === 1) post.upvotes = (Number(post.upvotes) || 0) - 1;
    if (prev === -1) post.downvotes = (Number(post.downvotes) || 0) - 1;

    if (next === 1) post.upvotes = (Number(post.upvotes) || 0) + 1;
    if (next === -1) post.downvotes = (Number(post.downvotes) || 0) + 1;

    if (next === 0) delete votes[postId];
    else votes[postId] = next;

    saveUserVotes(userId, votes);
    saveDatabase(db);
  }

  function addView(db, postId) {
    var post = db.posts.find(function (p) { return p && p.id === postId; });
    if (!post) return;
    post.views = (Number(post.views) || 0) + 1;
    saveDatabase(db);
  }


  function buildNewspaperArticle(db, post, index, locked) {
    var author = getAuthorName(db, post.authorId);
    var score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);

    var el = document.createElement("article");
    el.className = "article " + (index === 0 ? "lead" : "") + (locked ? " locked" : "");

    el.innerHTML =
      '<div class="section-row poppins-regular">' +
        '<span>' + prettyCategory(post.category) + '</span>' +
        '<span>' + (Number(post.views) || 0) + ' views</span>' +
      '</div>' +
      '<h2 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h2>' +
      '<div class="byline poppins-regular">By <b>' + escapeHtml(author) + '</b> • ' + escapeHtml(post.date) + '</div>' +
      '<div class="rule"></div>' +
      '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, index === 0 ? 260 : 140)) + '</p>' +
      '<div class="article-actions">' +
        '<span class="chip poppins-regular">Score: <b>' + score + '</b></span>' +
        '<div class="vote">' +
          '<button type="button" data-action="up" data-id="' + escapeHtml(post.id) + '">▲</button>' +
          '<button type="button" data-action="down" data-id="' + escapeHtml(post.id) + '">▼</button>' +
        '</div>' +
        '<button class="open-btn" type="button" data-action="open" data-id="' + escapeHtml(post.id) + '">Open</button>' +
      '</div>';

    return el;
  }

  function buildPopularRow(db, post, locked) {
    var author = getAuthorName(db, post.authorId);
    var score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);

    var el = document.createElement("div");
    el.className = "post-card-mini" + (locked ? " locked" : "");

    el.innerHTML =
      '<div class="post-header-mini">' +
        '<div class="user-info-mini">' +
          '<img src="assets/placeholder.png" class="avatar-mini" alt="avatar">' +
          '<span class="username-mini">' + escapeHtml(author) + '</span>' +
          '<span class="meta-mini">• score ' + score + '</span>' +
        '</div>' +
        '<span class="meta-mini">' + (Number(post.views) || 0) + ' views</span>' +
      '</div>' +
      '<h4 class="post-title-mini poppins-extrabold">' + escapeHtml(post.title) + '</h4>' +
      '<p class="post-desc-mini poppins-regular">' + escapeHtml(excerpt(post.content, 90)) + '</p>' +
      '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';

    el.addEventListener("click", function () {
      if (!isLoggedIn()) {
        AlertModal.show("Please login or sign up to view and interact with posts.", "error");
        return;
      }
      var db2 = getDatabase();
      addView(db2, post.id);
      AlertModal.show("Opened post (views updated)!", "success");
      render();
    });

    return el;
  }

  function buildDiscoverCard(db, post, locked) {

    var author = getAuthorName(db, post.authorId);

    var el = document.createElement("div");
    el.className = "post-card-mini" + (locked ? " locked" : "");
    el.setAttribute("data-category", post.category || "discussion");

    el.innerHTML =
      '<div class="post-header-mini">' +
        '<div class="user-info-mini">' +
          '<img src="assets/placeholder.png" class="avatar-mini" alt="avatar">' +
          '<span class="username-mini">' + escapeHtml(author) + '</span>' +
          '<span class="meta-mini">• ' + escapeHtml(post.date) + '</span>' +
        '</div>' +
        '<span class="meta-mini">' + (Number(post.views) || 0) + ' views</span>' +
      '</div>' +
      '<h4 class="post-title-mini poppins-extrabold">' + escapeHtml(post.title) + '</h4>' +
      '<p class="post-desc-mini poppins-regular">' + escapeHtml(excerpt(post.content, 90)) + '</p>' +
      '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';

    el.addEventListener("click", function () {
      if (!isLoggedIn()) {
        AlertModal.show("Please login or sign up to view and interact with posts.", "error");
        return;
      }
      var db2 = getDatabase();
      addView(db2, post.id);
      AlertModal.show("Opened post (views updated)!", "success");
      render();
    });

    return el;
  }

  
 
  
  function render() {
    if (mastheadDate) {
      mastheadDate.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }

    var logged = isLoggedIn();
    if (loginStatus) loginStatus.textContent = logged ? "Logged in" : "Guest mode";


    if (profileLink && !logged) {
      profileLink.textContent = "Login";
      profileLink.href = "login.html";
    }

    var db = getDatabase();
    seedPostsIfEmpty(db);
    db = getDatabase();

    
    var posts = (db.posts || []).slice().sort(function (a, b) {
      return parseDateSafe(b.date).getTime() - parseDateSafe(a.date).getTime();
    }).slice(0, 20);

    
    var FREE_COUNT = 5;
    if (paperGrid) {
      paperGrid.innerHTML = "";
      posts.forEach(function (post, i) {
        var lockedPost = (!logged && i >= FREE_COUNT);
        paperGrid.appendChild(buildNewspaperArticle(db, post, i, lockedPost));
      });
    }

    if (viewMoreGate) {
      viewMoreGate.style.display = (!logged && posts.length > FREE_COUNT) ? "block" : "none";
    }

    
    if (popularPreview) {
      popularPreview.innerHTML = "";
      var popular = (db.posts || []).slice().sort(function (a, b) {
        var scoreB = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
        var scoreA = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
        return scoreB - scoreA;
      }).slice(0, 4);

      popular.forEach(function (post) {
        popularPreview.appendChild(buildPopularRow(db, post, !logged));
      });
    }

    
    if (discoverPreview) {
      discoverPreview.innerHTML = "";
      var discover = posts.slice(0, 6).sort(function () { return 0.5 - Math.random(); }).slice(0, 4);
      discover.forEach(function (post) {
        discoverPreview.appendChild(buildDiscoverCard(db, post, !logged));
      });
    }

    
    if (paperGrid) {
      paperGrid.onclick = function (e) {
        var t = e.target;
        if (!t) return;

        var action = t.getAttribute("data-action");
        var id = t.getAttribute("data-id");
        if (!action || !id) return;

        if (!isLoggedIn()) {
          AlertModal.show("Please login or sign up to view more posts and interact.", "error");
          return;
        }

        var db2 = getDatabase();

        if (action === "up") {
          applyVote(db2, id, 1);
          AlertModal.show("Vote updated!", "success");
          render();
          return;
        }

        if (action === "down") {
          applyVote(db2, id, -1);
          AlertModal.show("Vote updated!", "success");
          render();
          return;
        }

        if (action === "open") {
          addView(db2, id);
          AlertModal.show("Opened post (views updated)!", "success");
          render();
          return;
        }
      };
    }
  }

  render();
});
