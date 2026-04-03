document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("login-form");
  var usernameInput = document.getElementById("username");
  var passwordInput = document.getElementById("password");
  var rememberMeCheckbox = document.getElementById("remember-me");
  var forgotToggleButton = document.getElementById("forgot-password-toggle");
  var forgotPanel = document.getElementById("forgot-password-panel");
  var forgotSubmitButton = document.getElementById("forgot-password-submit");
  var forgotUsernameInput = document.getElementById("forgot-username");
  var forgotNewPasswordInput = document.getElementById("forgot-new-password");
  var forgotConfirmPasswordInput = document.getElementById("forgot-confirm-password");

  // Password visibility toggle logic
  function initPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
      button.addEventListener("click", function () {
        var inputId = button.getAttribute("data-toggle-password");
        var input = inputId ? document.getElementById(inputId) : null;
        if (!input) return;

        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "Hide" : "Show";
        button.setAttribute("aria-label", (isHidden ? "Hide" : "Show") + " password");
      });
    });
  }

  var THREE_WEEKS_MS = 3 * 7 * 24 * 60 * 60 * 1000;

  function getRememberMeToken() {
    try {
      var token = localStorage.getItem("rememberMeToken");
      if (!token) return null;
      return JSON.parse(token);
    } catch (error) {
      return null;
    }
  }

  function saveRememberMeToken(usernameOrEmail, password) {
    var token = {
      usernameOrEmail: usernameOrEmail,
      password: password,
      expiresAt: Date.now() + THREE_WEEKS_MS
    };
    localStorage.setItem("rememberMeToken", JSON.stringify(token));
  }

  function clearRememberMeToken() {
    localStorage.removeItem("rememberMeToken");
  }

  function updateRememberMeExpiration() {
    var token = getRememberMeToken();
    if (token) {
      token.expiresAt = Date.now() + THREE_WEEKS_MS;
      localStorage.setItem("rememberMeToken", JSON.stringify(token));
    }
  }

  function isRememberMeValid() {
    var token = getRememberMeToken();
    if (!token) return false;
    return Date.now() < token.expiresAt;
  }

  async function performLogin(usernameOrEmail, password) {
    // POST: submit login credentials and receive auth token/session user
    var payload = await window.apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: usernameOrEmail, password: password })
    });

    if (!payload || !payload.user) {
      return false;
    }

    window.setAuthSession(payload.user);
    await window.bootstrapMockDatabase();
    return true;
  }

  async function autoLoginWithRememberMe() {
    if (!isRememberMeValid()) {
      clearRememberMeToken();
      return false;
    }

    var token = getRememberMeToken();
    if (!token) return false;

    try {
      var ok = await performLogin(token.usernameOrEmail, token.password);
      if (ok) {
        updateRememberMeExpiration();
        return true;
      }
      clearRememberMeToken();
      return false;
    } catch (error) {
      clearRememberMeToken();
      return false;
    }
  }

  function clearForgotPasswordInputs() {
    if (forgotUsernameInput) forgotUsernameInput.value = "";
    if (forgotNewPasswordInput) forgotNewPasswordInput.value = "";
    if (forgotConfirmPasswordInput) forgotConfirmPasswordInput.value = "";
  }

  async function resetPassword(usernameOrEmail, newPassword, confirmNewPassword) {
    // POST: reset password by username/email for account recovery
    return window.apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: usernameOrEmail, newPassword: newPassword, confirmNewPassword: confirmNewPassword })
    });
  }

  if (!form) return;

  initPasswordToggles();

  if (forgotToggleButton && forgotPanel) {
    forgotToggleButton.addEventListener("click", function () {
      var isOpen = forgotPanel.style.display !== "none";
      forgotPanel.style.display = isOpen ? "none" : "flex";
      forgotToggleButton.textContent = isOpen ? "Forgot password?" : "Cancel password reset";

      if (!isOpen && forgotUsernameInput && usernameInput && usernameInput.value.trim()) {
        forgotUsernameInput.value = usernameInput.value.trim();
      }

      if (isOpen) {
        clearForgotPasswordInputs();
      }
    });
  }

  if (forgotSubmitButton) {
    forgotSubmitButton.addEventListener("click", async function () {
      var usernameOrEmail = forgotUsernameInput ? forgotUsernameInput.value.trim() : "";
      var newPassword = forgotNewPasswordInput ? forgotNewPasswordInput.value : "";
      var confirmPassword = forgotConfirmPasswordInput ? forgotConfirmPasswordInput.value : "";

      if (!usernameOrEmail) {
        AlertModal.show("Please enter your username or email.", "error");
        return;
      }

      if (!newPassword) {
        AlertModal.show("Please enter a new password.", "error");
        return;
      }

      if (newPassword.length < 6) {
        AlertModal.show("New password must be at least 6 characters.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        AlertModal.show("Password confirmation does not match.", "error");
        return;
      }

      try {
        await resetPassword(usernameOrEmail, newPassword, confirmPassword);
        localStorage.removeItem("rememberMeToken");
        clearForgotPasswordInputs();
        if (forgotPanel) forgotPanel.style.display = "none";
        if (forgotToggleButton) forgotToggleButton.textContent = "Forgot password?";
        AlertModal.show("Password reset successful. You can now log in.", "success");
      } catch (error) {
        AlertModal.show(error.message || "Failed to reset password.", "error");
      }
    });
  }

  autoLoginWithRememberMe().then(function (didAutoLogin) {
    if (didAutoLogin) {
      window.location.href = "/home";
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    var usernameOrEmail = usernameInput ? usernameInput.value.trim() : "";
    if (!usernameOrEmail) {
      AlertModal.show("Please enter your username or email.", "error");
      return;
    }

    var password = passwordInput ? passwordInput.value : "";
    if (!password) {
      AlertModal.show("Please enter your password.", "error");
      return;
    }

    try {
      var ok = await performLogin(usernameOrEmail, password);
      if (!ok) {
        AlertModal.show("Invalid credentials. Please try again.", "error");
        return;
      }

      var rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
      if (rememberMe) saveRememberMeToken(usernameOrEmail, password);
      else clearRememberMeToken();

      if (passwordInput) passwordInput.value = "";
      window.location.href = "/home";
    } catch (error) {
      AlertModal.show(error.message || "Login failed.", "error");
    }
  });
});
