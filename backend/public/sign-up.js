document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("sign-up-form");
  var usernameInput = document.getElementById("username");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var username = (usernameInput && usernameInput.value || "").trim();
    var email = (emailInput && emailInput.value || "").trim();
    var password = (passwordInput && passwordInput.value || "").trim();

    if (!username || !email || !password) {
      AlertModal.show("Please fill in all fields!", "error");
      return;
    }

    if (password.length < 6) {
      AlertModal.show("Password must be at least 6 characters long!", "error");
      return;
    }

    try {
      // POST: create a new user account
      var payload = await window.apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username, email: email, password: password })
      });

      if (!payload || !payload.user) {
        AlertModal.show("Registration failed. Please try again.", "error");
        return;
      }

      window.setAuthSession(payload.user);
      await window.bootstrapMockDatabase();

      AlertModal.show("Account created successfully! Welcome to Animo Commons!", "success");
      setTimeout(function () {
        window.location.href = "/home";
      }, 1000);
    } catch (error) {
      AlertModal.show(error.message || "Sign up failed.", "error");
    }
  });
});
