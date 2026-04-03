document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("sign-up-form");
  var usernameInput = document.getElementById("username");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var confirmPasswordInput = document.getElementById("confirm-password");
  
  var yearInput = document.getElementById("year");
  var majorInput = document.getElementById("major");
  var pronounsInput = document.getElementById("pronouns");
  var profilePicInput = document.getElementById("profile-pic");

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

  initPasswordToggles();

  // Validation feedback UI
  let timeoutId;
  async function checkAvailability(field, value, feedbackEl) {
    if (!value) {
      feedbackEl.textContent = "";
      return;
    }
    
    // Front-end formatting check first
    if (field === 'username') {
      if (value.length < 3) {
        feedbackEl.textContent = "Too short (min 3 chars).";
        feedbackEl.style.color = "#d32f2f";
        return;
      }
      if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(value)) {
        feedbackEl.textContent = "Invalid characters.";
        feedbackEl.style.color = "#d32f2f";
        return;
      }
    } else if (field === 'email') {
      if (!/^[^\s@]+@dlsu\.edu\.ph$/.test(value)) {
        feedbackEl.textContent = "Must be a valid @dlsu.edu.ph email.";
        feedbackEl.style.color = "#d32f2f";
        return;
      }
    }

    try {
      if (!window.apiRequest) return; // Wait in case api isn't ready
      const res = await window.apiRequest("/api/auth/check-availability", {
        method: "POST",
        body: JSON.stringify({ field: field, value: value })
      });
      
      if (res && res.available) {
        feedbackEl.textContent = "✔ Available";
        feedbackEl.style.color = "#388e3c";
      } else {
        feedbackEl.textContent = "✘ Already taken";
        feedbackEl.style.color = "#d32f2f";
      }
    } catch (err) {
      // Silently fail if network error so it doesn't interrupt flow
      feedbackEl.textContent = "";
    }
  }

  function setupDebouncedValidation(inputEl, field, feedbackId) {
    if (!inputEl) return;
    const feedbackEl = document.getElementById(feedbackId);
    if (!feedbackEl) return;

    inputEl.addEventListener("input", function() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkAvailability(field, inputEl.value.trim(), feedbackEl);
      }, 500); // Wait 500ms after they stop typing
    });
  }

  setupDebouncedValidation(usernameInput, 'username', 'username-feedback');
  setupDebouncedValidation(emailInput, 'email', 'email-feedback');

  // Fetch and populate degrees datalist
  async function loadDegrees() {
    const datalist = document.getElementById("major-options");
    if (!datalist) return;
    
    try {
      const response = await fetch("/degrees.json");
      if (!response.ok) throw new Error("Failed to load degrees");
      const degrees = await response.json();
      
      degrees.forEach(function (degree) {
        const option = document.createElement("option");
        option.value = degree.code;
        option.textContent = degree.title;
        datalist.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading degrees:", err);
    }
  }
  
  loadDegrees();

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var username = (usernameInput && usernameInput.value || "").trim();
    var email = (emailInput && emailInput.value || "").trim();
    var password = (passwordInput && passwordInput.value || "").trim();
    var confirmPassword = (confirmPasswordInput && confirmPasswordInput.value || "").trim();
    
    var year = (yearInput && yearInput.value || "").trim();
    var major = (majorInput && majorInput.value || "").trim();
    var pronouns = (pronounsInput && pronounsInput.value || "").trim();

    if (!username || !email || !password || !confirmPassword) {
      AlertModal.show("Please fill in all fields!", "error");
      return;
    }

    var usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      AlertModal.show("Username must be 3-20 characters long and can only contain letters, numbers, dots, underscores, and hyphens.", "error");
      return;
    }

    if (major && !/^[a-zA-Z0-9\s.,&()+-]{0,150}$/.test(major)) {
      AlertModal.show("Major contains invalid characters.", "error");
      return;
    }

    if (pronouns && !/^[a-zA-Z\s/-]{0,20}$/.test(pronouns)) {
      AlertModal.show("Pronouns can only contain letters, spaces, slashes, and hyphens.", "error");
      return;
    }

    if (password !== confirmPassword) {
      AlertModal.show("Passwords do not match!", "error");
      return;
    }

    var emailRegex = /^[^\s@]+@dlsu\.edu\.ph$/;
    if (!emailRegex.test(email)) {
      AlertModal.show("Please enter a valid DLSU email address! (name@dlsu.edu.ph)", "error");
      return;
    }

    var pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwRegex.test(password)) {
      AlertModal.show("Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, and one number.", "error");
      return;
    }

    var profilePicFile = profilePicInput && profilePicInput.files ? profilePicInput.files[0] : null;
    if (profilePicFile) {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(profilePicFile.type)) {
        AlertModal.show("Only .png, .jpg, and .jpeg files are allowed for profile pictures.", "error");
        return;
      }
      
      var maxSize = 2 * 1024 * 1024; // 2MB
      if (profilePicFile.size > maxSize) {
        AlertModal.show("Profile picture must be less than 2MB.", "error");
        return;
      }
    }

    async function getBase64(file) {
      if (!file) return null;
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }

    try {
      const base64Photo = await getBase64(profilePicFile);
      
      // POST: create a new user account
      var payload = await window.apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          username: username, 
          email: email, 
          password: password,
          year: year,
          major: major,
          pronouns: pronouns,
          photo: base64Photo
        })
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
