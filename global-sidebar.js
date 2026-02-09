document.addEventListener("DOMContentLoaded", function () {
    var sidebar = document.querySelector(".global-sidebar");
    if (!sidebar) {
        sidebar = document.createElement("aside");
        sidebar.className = "global-sidebar";
        sidebar.innerHTML =
            '<div class="sidebar-brand">' +
            '<img src="assets/logo.png" alt="Animo Commons Logo" width="32" height="32">' +
            "</div>" +
            '<nav class="sidebar-nav">' +
            '<a class="sidebar-link" href="home.html" aria-label="Home" title="Home">' +
            '<img src="assets/home-icon.png" alt="Home">' +
            "</a>" +
            '<a class="sidebar-link" href="discover.html" aria-label="Discover" title="Discover">' +
            '<img src="assets/discover-icon.png" alt="Discover">' +
            "</a>" +
            '<a class="sidebar-link" href="popular.html" aria-label="Popular" title="Popular">' +
            '<img src="assets/popular-icon.png" alt="Popular">' +
            "</a>" +
            '<a class="sidebar-link" href="profile.html" aria-label="Profile" title="Profile">' +
            '<img src="assets/profile-icon.png" alt="Profile">' +
            "</a>" +
            "</nav>" +
            '<div class="sidebar-footer">' +
            '<a class="sidebar-link" href="edit-profile.html" aria-label="Edit Profile" title="Edit Profile">' +
            '<img src="assets/settings-icon.png" alt="Edit Profile">' +
            "</a>" +
            "</div>";

        var mainContent = document.querySelector(".main-content");
        if (mainContent) {
            document.body.insertBefore(sidebar, mainContent);
        } else {
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
    }

    var tabs = {
        home: "#a3b565",
        profile: "#504e76",
        popular: "#f1642e",
        discover: "#f1b02e"
    };
    var nav = document.querySelector("nav-bar");
    var active = nav ? nav.getAttribute("active") : "home";
    var sidebarColor = tabs[active] || "#4f4d73";
    var pageSection = document.querySelector(".page-section");
    if (pageSection) {
        var pageColor = getComputedStyle(pageSection).getPropertyValue("--page-color").trim();
        if (pageColor) {
            sidebarColor = pageColor;
        }
    }
    document.documentElement.style.setProperty("--sidebar-color", sidebarColor);
    sidebar.style.setProperty("--sidebar-color", sidebarColor);
});
