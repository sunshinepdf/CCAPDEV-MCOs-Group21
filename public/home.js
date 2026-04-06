document.addEventListener("DOMContentLoaded", function () {
  var paperGrid = document.getElementById("paperGrid");
  var popularPreview = document.getElementById("popularPreview");
  var discoverPreview = document.getElementById("discoverPreview");
  var viewMoreGate = document.getElementById("viewMoreGate");
  var mastheadDate = document.getElementById("mastheadDate");

  function isLoggedIn() {
    var id = (sessionStorage.getItem("currentUserId") || "").trim();
    return id.length > 0;
  }

  function getAuthorName(authorId) {
    var users = (window.mockDatabase && window.mockDatabase.users) ? window.mockDatabase.users : [];
    var u = users.find(function (x) { return x && x.id === authorId; });
    return u ? (u.username || String(authorId || "Anonymous")) : String(authorId || "Anonymous");
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

  function prettyCategory(cat) {
    var c = String(cat || "").toLowerCase();
    if (c === "news") return "News";
    if (c === "help") return "Help";
    return "Discussion";
  }

  function addView(postId) {
    PostsComponent_Instance.incrementViewCount(postId);
  }

  function buildNewspaperArticle(post, index, locked) {
    return PostsComponent_Instance.buildNewspaperArticle(post, index, locked);
  }

  function buildPopularRow(post, locked) {
    var user = PostsComponent_Instance.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };
    var score = (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0);

    var el = document.createElement("div");
    el.className = "post-card-mini" + (locked ? " locked" : "");
    el.setAttribute("data-locked", locked ? "1" : "0");
    el.setAttribute("data-id", post.id);

    el.innerHTML =
      '<div class="post-author-header poppins-regular">' +
        '<img src="' + user.photo + '" alt="' + escapeHtml(user.username) + '" class="post-author-avatar">' +
        '<div class="post-author-info">' +
          '<span class="post-author-username poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
          '<span class="post-author-date">' + escapeHtml(post.date) + (post.lastEdited ? ' &#8226; Edited ' + post.lastEdited : '') + '</span>' +
        '</div>' +
      '</div>' +
      '<h4 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h4>' +
      '<div class="section-row poppins-regular">' +
        '<span>' + (Number(post.views) || 0) + ' Views &#8226; Score ' + score + '</span>' +
      '</div>' +
      '<div class="rule"></div>' +
      '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, 90)) + '</p>' +
      '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';

    return el;
  }

  function buildDiscoverCard(post, locked) {
    var user = PostsComponent_Instance.getUserById(post.authorId) || { username: "Unknown", photo: "assets/placeholder.png" };

    var el = document.createElement("div");
    el.className = "post-card-mini" + (locked ? " locked" : "");
    el.setAttribute("data-category", post.category || "discussion");
    el.setAttribute("data-locked", locked ? "1" : "0");
    el.setAttribute("data-id", post.id);

    el.innerHTML =
      '<div class="post-author-header poppins-regular">' +
        '<img src="' + user.photo + '" alt="' + escapeHtml(user.username) + '" class="post-author-avatar">' +
        '<div class="post-author-info">' +
          '<span class="post-author-username poppins-extrabold">' + escapeHtml(user.username) + '</span>' +
          '<span class="post-author-date">' + escapeHtml(post.date) + (post.lastEdited ? ' &#8226; Edited ' + post.lastEdited : '') + '</span>' +
        '</div>' +
      '</div>' +
      '<h4 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h4>' +
      '<div class="section-row poppins-regular">' +
        '<span>' + (Number(post.views) || 0) + ' Views &#8226; &#9650; ' + (Number(post.upvotes) || 0) + ' &#9660; ' + (Number(post.downvotes) || 0) + '</span>' +
      '</div>' +
      '<div class="rule"></div>' +
      '<p class="excerpt poppins-regular">' + escapeHtml(excerpt(post.content, 90)) + '</p>' +
      '<div class="tags-mini"><span>' + prettyCategory(post.category) + '</span></div>';

    return el;
  }

  function render() {
    var posts = (PostsComponent_Instance.getDatabase() && PostsComponent_Instance.getDatabase().posts) || [];

    if (mastheadDate) {
      mastheadDate.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    var logged = isLoggedIn();
    var activeUserId = (sessionStorage.getItem("currentUserId") || "").trim();

    var latest = posts
      .slice()
      .sort(function (a, b) {
        return parseDateSafe(b.date).getTime() - parseDateSafe(a.date).getTime();
      })
      .slice(0, 20);

    var FREE_COUNT = (typeof PostsComponent_Instance.getGuestFreePostCount === "function")
      ? PostsComponent_Instance.getGuestFreePostCount()
      : 15;

    if (paperGrid) {
      paperGrid.innerHTML = "";
      latest.forEach(function (post, i) {
        var lockedPost = (!logged && i >= FREE_COUNT);
        paperGrid.appendChild(buildNewspaperArticle(post, i, lockedPost));
      });
    }

    if (viewMoreGate) {
      viewMoreGate.style.display = !logged ? "block" : "none";
    }

    if (popularPreview) {
      popularPreview.innerHTML = "";
      var popular = posts
        .slice()
        .sort(function (a, b) {
          var scoreB = (Number(b.upvotes) || 0) - (Number(b.downvotes) || 0);
          var scoreA = (Number(a.upvotes) || 0) - (Number(a.downvotes) || 0);
          return scoreB - scoreA;
        })
        .slice(0, 4);

      popular.forEach(function (p, idx) {
        var lockedRow = !logged;
        popularPreview.appendChild(buildPopularRow(p, lockedRow));
      });
    }

    if (discoverPreview) {
      discoverPreview.innerHTML = "";

      var discover = latest.slice(0, 4);

      discover.forEach(function (p, i) {
        var lockedCard = (!logged && i >= 1);
        discoverPreview.appendChild(buildDiscoverCard(p, lockedCard));
      });
    }

    if (paperGrid) {
      paperGrid.onclick = function (e) {
        var t = e.target;
        if (!t) return;

        var action = t.getAttribute("data-action");
        var id = t.getAttribute("data-id");
        if (!action || !id) return;

        var article = t.closest(".article");
        var isLocked = article && article.getAttribute("data-locked") === "1";

        var activeUserId = (sessionStorage.getItem("currentUserId") || "").trim();
        var loggedNow = activeUserId.length > 0;

        if (!loggedNow || isLocked) {
          AlertModal.show("Please login or sign up to view and interact with posts.", "error");
          return;
        }

        if (action === "open" || action === "comment") {
          window.openPostModal(id);
          render();
          return;
        }

        if (action === "up") {
          PostsComponent_Instance.voteOnPost(id, "up");
          render();
          return;
        }

        if (action === "down") {
          PostsComponent_Instance.voteOnPost(id, "down");
          render();
          return;
        }
      };
    }

    if (popularPreview) {
      popularPreview.onclick = function (e) {
        var t = e.target.closest(".post-card-mini");
        if (!t) return;

        var activeUserId = (sessionStorage.getItem("currentUserId") || "").trim();
        var loggedNow = activeUserId.length > 0;
        var isLocked = t.getAttribute("data-locked") === "1";
        var id = t.getAttribute("data-id");

        if (!loggedNow || isLocked) {
          AlertModal.show("Please login or sign up to view and interact with posts.", "error");
          return;
        }

        window.openPostModal(id);
        render();
      };
    }

    if (discoverPreview) {
      discoverPreview.onclick = function (e) {
        var t = e.target.closest(".post-card-mini");
        if (!t) return;

        var activeUserId = (sessionStorage.getItem("currentUserId") || "").trim();
        var loggedNow = activeUserId.length > 0;
        var isLocked = t.getAttribute("data-locked") === "1";
        var id = t.getAttribute("data-id");

        if (!loggedNow || isLocked) {
          AlertModal.show("Please login or sign up to view and interact with posts.", "error");
          return;
        }

        window.openPostModal(id);
        render();
      };
    }
  }

  render();
  window.triggerPostsUpdate = render;
});
