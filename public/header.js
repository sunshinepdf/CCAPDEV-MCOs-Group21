document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".header")) {
        return;
    }

    var mainContent = document.querySelector(".main-content");
    if (!mainContent) {
        return;
    }

    var header = document.createElement("header");
    header.className = "header";

    var headerBg = document.body.getAttribute("data-header-bg") || "#fdf8e2";
    header.style.setProperty("--header-bg", headerBg);

    var contentDiv = document.createElement("div");
    contentDiv.className = "header-content";
    contentDiv.innerHTML =
        '<img src="assets/logo.png" alt="Animo Commons Logo" width="100" height="100">' +
        '<h1 class="poppins-extrabold">Animo Commons</h1>';

    var userDiv = document.createElement("div");
    userDiv.className = "header-user";
    var isLoggedIn = (localStorage.getItem("currentUserId") || "").trim().length > 0;
    userDiv.innerHTML =
        '<span class="header-user-label poppins-regular">Session</span>' +
        '<span class="header-status-pill poppins-regular" id="header-status-pill">' +
            (isLoggedIn ? "Logged in" : "Guest mode") +
        '</span>';

    header.appendChild(contentDiv);
    header.appendChild(userDiv);

    mainContent.insertBefore(header, mainContent.firstChild);
});

