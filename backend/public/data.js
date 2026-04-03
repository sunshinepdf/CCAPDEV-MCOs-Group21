(function () {
  var AUTH_TOKEN_KEY = "authToken";
  var CURRENT_USER_ID_KEY = "currentUserId";

  function toDisplayDate(value) {
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  function mapUser(user) {
    if (!user) return null;
    return {
      id: user.id || user._id || "",
      username: user.username || "Unknown",
      email: user.email || "",
      photo: user.photo || "assets/profile-icon-default.png",
      year: user.year || "",
      pronouns: user.pronouns || "",
      major: user.major || "",
      bio: user.bio || "",
      tags: Array.isArray(user.tags) ? user.tags : []
    };
  }

  function mapPost(post) {
    if (!post) return null;
    var author = post.authorId && typeof post.authorId === "object" ? post.authorId : null;
    var editedAt = post.editedAt || post.lastEdited || null;
    var lastUpvotedAt = post.lastUpvotedAt || null;
    if (!lastUpvotedAt && (Number(post.upvotes) || 0) > 0) {
      lastUpvotedAt = post.lastInteraction || post.createdAt || post.date || null;
    }
    return {
      id: post.id || post._id || "",
      authorId: author ? normalizeId(author) : normalizeId(post.authorId),
      category: post.category || "discussion",
      title: post.title || "",
      content: post.content || "",
      date: toDisplayDate(post.createdAt || post.date),
      lastEdited: editedAt ? toDisplayDate(editedAt) : "",
      upvotes: Number(post.upvotes) || 0,
      downvotes: Number(post.downvotes) || 0,
      views: Number(post.views) || 0,
      votes: post.votes && typeof post.votes === "object" ? post.votes : {},
      comments: Array.isArray(post.comments) ? post.comments.map(function (comment) {
        return {
          id: normalizeId(comment.id || comment._id),
          userId: normalizeId(comment.userId),
          text: comment.text || "",
          parentId: comment.parentId ? normalizeId(comment.parentId) : null,
          createdAt: comment.createdAt || null,
          editedAt: comment.editedAt || null,
          votes: comment.votes && typeof comment.votes === "object" ? comment.votes : {}
        };
      }) : [],
      lastUpvotedAt: lastUpvotedAt ? new Date(lastUpvotedAt).getTime() : null,
      lastInteraction: post.lastInteraction ? new Date(post.lastInteraction).getTime() : Date.now()
    };
  }

  function getAuthToken() {
    return (localStorage.getItem(AUTH_TOKEN_KEY) || "").trim();
  }

  function setSession(user, token) {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    if (user && user.id) {
      localStorage.setItem(CURRENT_USER_ID_KEY, String(user.id));
    }
  }

  function clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    localStorage.removeItem("rememberMeToken");
  }

  async function apiRequest(path, options) {
    var opts = options || {};
    var headers = Object.assign({}, opts.headers || {});
    var token = getAuthToken();

    if (token && !headers.Authorization) {
      headers.Authorization = "Bearer " + token;
    }

    var hasBody = typeof opts.body !== "undefined";
    if (hasBody && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    var fetchOpts = Object.assign({ credentials: "include" }, opts, { headers: headers });
    var response = await fetch(path, fetchOpts);
    var payload = null;

    try { payload = await response.json(); }
    catch (error) { payload = null; }

    if (!response.ok) {
      var message = payload && payload.message ? payload.message : ("Request failed: " + response.status);
      throw new Error(message);
    }

    return payload;
  }

  async function bootstrapMockDatabase() {
    var database = { users: [], posts: [] };
    var usersById = {};

    try {
      // GET: fetch initial posts feed for client bootstrap
      var postsPayload = await apiRequest("/api/posts?sortBy=recent&page=1&limit=50", { method: "GET" });
      var posts = Array.isArray(postsPayload && postsPayload.posts) ? postsPayload.posts : [];

      database.posts = posts.map(function (post) {
        if (post && post.authorId && typeof post.authorId === "object") {
          var mappedAuthor = mapUser(post.authorId);
          if (mappedAuthor && mappedAuthor.id) {
            usersById[mappedAuthor.id] = mappedAuthor;
          }
        }
        return mapPost(post);
      }).filter(Boolean);

      var mePayload = null;
      try {
        // GET: fetch currently authenticated user profile
        mePayload = await apiRequest("/api/users/me", { method: "GET" });
      } catch (error) {
        mePayload = null;
      }

      if (mePayload && mePayload.user) {
        var meMapped = mapUser(mePayload.user);
        if (meMapped && meMapped.id) {
          usersById[meMapped.id] = meMapped;
          localStorage.setItem(CURRENT_USER_ID_KEY, meMapped.id);
        }
      }

      database.users = Object.keys(usersById).map(function (key) { return usersById[key]; });
    } catch (error) {
      database = { users: [], posts: [] };
    }

    window.mockDatabase = database;
    window.dispatchEvent(new CustomEvent("animo:data-ready", { detail: { database: database } }));
    return database;
  }

  function saveToLocalDB() {
    return;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    clearSession();
    window.location.href = "/login";
  }

  window.CURRENT_USER_ID = localStorage.getItem(CURRENT_USER_ID_KEY) || "";
  window.getAuthToken = getAuthToken;
  window.apiRequest = apiRequest;
  window.bootstrapMockDatabase = bootstrapMockDatabase;
  window.setAuthSession = setSession;
  window.clearAuthSession = clearSession;
  window.mapApiUser = mapUser;
  window.mapApiPost = mapPost;
  window.saveToLocalDB = saveToLocalDB;
  window.logout = logout;

  window.mockDatabase = { users: [], posts: [] };
  bootstrapMockDatabase();
})();
