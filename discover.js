let selectedCategories = [];

function toggleFilter() {
    const overlay = document.getElementById("filterOverlay");

    if (overlay.style.display === "flex") {
        overlay.style.display = "none";
    } else {
        overlay.style.display = "flex";
    }
}

document.addEventListener("click", function (event) {
    const overlay = document.getElementById("filterOverlay");
    const panel = document.getElementById("filterPanel");

    if (!overlay.contains(event.target) && event.target.closest(".filter-btn") == null) {
        overlay.style.display = "none";
    }

    if (event.target === overlay) {
        overlay.style.display = "none";
    }
});

function applyFilters() {
    const checkboxes = document.querySelectorAll(".filter-panel input[type='checkbox']");
    selectedCategories = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedCategories.push(cb.value);
        }
    });

    filterPosts();
    toggleFilter();
}

function filterPosts() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const posts = document.querySelectorAll(".post-card");

    posts.forEach(post => {
        const title = post.querySelector(".post-title").innerText.toLowerCase();
        const content = post.querySelector(".post-desc").innerText.toLowerCase();
        const category = post.getAttribute("data-category");

        const matchesSearch =
            title.includes(searchInput) || content.includes(searchInput);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(category);

        if (matchesSearch && matchesCategory) {
            post.style.display = "flex";
        } else {
            post.style.display = "none";
        }
    });
}
