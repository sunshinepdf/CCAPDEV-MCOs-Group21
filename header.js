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
    userDiv.innerHTML = '';

    header.appendChild(userDiv);
    header.appendChild(contentDiv);

    mainContent.insertBefore(header, mainContent.firstChild);
});

