document.addEventListener("DOMContentLoaded", function () {
    var sidebar = document.querySelector(".global-sidebar");
    if (!sidebar) {
        sidebar = document.createElement("aside");
        sidebar.className = "global-sidebar";
        sidebar.innerHTML =
            '<div class="sidebar-brand">' +
            '<img src="assets/logo-b.png" alt="Animo Commons Logo" width="100" height="100">' +
            "</div>" +
            '<div class="sidebar-footer">' +
            '<div class="logout-container">' +
            '<button class="logout-btn" onclick="logout()" aria-label="Logout" title="Logout">' +
            '<img src="assets/logout-icon.png" alt="Logout" width="60" height="60">' +
            "</button>" +
            '<span class="logout-text">Logout</span>' +
            "</div>" +
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
