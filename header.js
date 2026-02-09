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

    header.innerHTML =
        '<div class="header-content">' +
        '<img src="assets/logo.png" alt="Animo Commons Logo" width="32" height="32">' +
        '<h1 class="poppins-extrabold">Animo Commons</h1>' +
        "</div>";

    mainContent.insertBefore(header, mainContent.firstChild);
});
