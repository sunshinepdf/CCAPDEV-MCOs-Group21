let selectedCategories = [];
let selectedColleges = [];

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function capitalize(text) {
  text = String(text || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeCollegeValue(value) {
  return normalizeText(value).toUpperCase();
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

  generateCategoryFilters();

  const sortedPosts = PostsComponent_Instance.getFilteredPosts({ sortBy: "hot" });
  const isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
  const FREE_COUNT = typeof PostsComponent_Instance.getGuestFreePostCount === "function"
    ? PostsComponent_Instance.getGuestFreePostCount()
    : 15;

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

function generateCategoryFilters() {
  const container = document.getElementById("dynamicFilters");
  if (!container) return;
  container.innerHTML = `
    <h4>Main Tags</h4>
    <div id="mainTagsFilter" class="filter-section"></div>
    <h4>College</h4>
    <div id="collegeTagsFilter" class="filter-section"></div>
  `;

  const mainTagsContainer = document.getElementById("mainTagsFilter");
  const collegeTagsContainer = document.getElementById("collegeTagsFilter");

  const categories = ["discussion", "help", "news"];
  categories.forEach(category => {
    const label = document.createElement("label");
    label.className = "filter-option";
    label.innerHTML = `
      <input type="checkbox" value="${category}" data-type="category">
      <span class="tags-preview"><span>${capitalize(category)}</span></span>
    `;
    mainTagsContainer.appendChild(label);
  });

  const colleges = ["CLA", "SOE", "COS", "GCOE", "CCS", "RVRCOB", "BAGCED", "SIS"];
  colleges.forEach(college => {
    const label = document.createElement("label");
    label.className = "filter-option";
    label.innerHTML = `
      <input type="checkbox" value="${college}" data-type="college">
      <span class="tags-preview"><span>${college}</span></span>
    `;
    collegeTagsContainer.appendChild(label);
  });
}

function applyFilters() {
  const checkboxes = document.querySelectorAll(".filter-panel input[type='checkbox']");
  selectedCategories = [];
  selectedColleges = [];

  checkboxes.forEach(cb => {
    if (cb.checked) {
      if (cb.dataset.type === "category") {
        selectedCategories.push(String(cb.value || "").toLowerCase());
      } else if (cb.dataset.type === "college") {
        selectedColleges.push(String(cb.value || ""));
      }
    }
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
    const college = String(post.getAttribute("data-college") || "");
    const normalizedPostCollege = normalizeCollegeValue(college);

    const matchesSearch = searchInput === "" || title.includes(searchInput) || content.includes(searchInput);
    
    // Default matching: if selectedCategories/Colleges is empty, we match everything
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
    const matchesCollege = selectedColleges.length === 0 || selectedColleges.some(function (selectedCollege) {
      return normalizeCollegeValue(selectedCollege) === normalizedPostCollege;
    });

    post.style.display = (matchesSearch && matchesCategory && matchesCollege) ? "block" : "none";
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
      PostsComponent_Instance.handlePostAction(e);
    };
  }
});

// Expose render function globally for comment updates
window.triggerPostsUpdate = renderDiscoverPosts;