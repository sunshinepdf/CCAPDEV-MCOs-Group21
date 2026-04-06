document.addEventListener("DOMContentLoaded", function () {
  const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
  const DEFAULT_CROPPED_PHOTO_SIZE_PX = 512;
  const MAX_CROPPED_PHOTO_SIZE_PX = 1024;

  // Helper functions for user authentication and database access (mocked or real)
  function isLoggedIn() {
    return (localStorage.getItem("currentUserId") || "").trim().length > 0;
  }

  function getCurrentUserId() {
    return (localStorage.getItem("currentUserId") || "").trim();
  }

  function getDatabase() {
    if (typeof mockDatabase !== "undefined" && mockDatabase) return mockDatabase;
    return { users: [], posts: [] };
  }

  function persistDatabase() {
    return;
  }

  function setSelectValue(selectEl, value) {
    if (!selectEl) return;
    var v = String(value || "").trim();
    if (!v) return;

    var normalized = v.toLowerCase();
    var options = Array.prototype.slice.call(selectEl.options || []);
    var match = options.find(function (opt) {
      return String(opt.value || "").toLowerCase() === normalized;
    });
    selectEl.value = match ? match.value : v;
  }

  function getNormalizedSelectValue(selectEl) {
    if (!selectEl) return "";
    var rawValue = String(selectEl.value || "");
    var normalized = rawValue.toLowerCase();
    var options = Array.prototype.slice.call(selectEl.options || []);
    var match = options.find(function (opt) {
      return String(opt.value || "").toLowerCase() === normalized;
    });
    return match ? match.value : rawValue;
  }

  function validateProfilePhotoFile(file) {
    if (!file) return null;

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return "Only .png, .jpg, and .jpeg files are allowed.";
    }

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      return "Profile picture must be less than 2MB.";
    }

    return null;
  }

  function getOutputPhotoMimeType(file) {
    if (file && file.type === "image/png") return "image/png";
    return "image/jpeg";
  }

  function getAdaptiveCropSize(cropper) {
    if (!cropper) return DEFAULT_CROPPED_PHOTO_SIZE_PX;
    const data = cropper.getData(true) || {};
    const detectedSide = Math.round(Number(data.width) || 0);
    if (!detectedSide || detectedSide < 1) return DEFAULT_CROPPED_PHOTO_SIZE_PX;
    return Math.min(detectedSide, MAX_CROPPED_PHOTO_SIZE_PX);
  }

  if (!isLoggedIn()) {

    if (typeof AlertModal !== "undefined") {
      AlertModal.show("Please login to edit your profile.", "error");
    }
    window.location.href = "/login";
    return;
  }

  var currentUserId = getCurrentUserId();
  var db = getDatabase();

  if (!db.users || !Array.isArray(db.users)) db.users = [];

  var user = db.users.find(function (u) { return u && u.id === currentUserId; }) || {
    id: currentUserId,
    username: "",
    bio: "Hello! I'm a student at De La Salle University sharing my thoughts on Animo Commons.",
    pronouns: "",
    year: "",
    major: "",
    photo: "assets/profile-icon-default.png",
    tags: []
  };

  var saveButton = document.getElementById("save-profile-edits");
  var resetButton = document.getElementById("reset-profile-to-default");

  var nameInput = document.getElementById("edit-name");
  var bioInput = document.getElementById("edit-bio");
  var pronounsInput = document.getElementById("edit-pronouns");
  var yearInput = document.getElementById("edit-year");
  var majorInput = document.getElementById("edit-major");
  var currentPasswordInput = document.getElementById("edit-current-password");
  var newPasswordInput = document.getElementById("edit-new-password");
  var confirmPasswordInput = document.getElementById("edit-confirm-password");

  var avatarInput = document.getElementById("upload-profile-photo");
  var avatarPreview = document.getElementById("user-profile-photo");

  var tagsEdit = document.getElementById("edit-tags");

  if (!saveButton) return;

  function initPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
      button.addEventListener("click", function () {
        var inputId = button.getAttribute("data-toggle-password");
        var input = inputId ? document.getElementById(inputId) : null;
        if (!input) return;

        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "Hide" : "Show";
      });
    });
  }

  function clearPasswordInputs() {
    if (currentPasswordInput) currentPasswordInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
  }

  initPasswordToggles();

  var defaultTags = ["CCS", "ID 124", "Friendly"];
  var tags = Array.isArray(user.tags) ? user.tags.slice() : [];

  function renderEditableTags(container) {
    if (!container) return;

    container.innerHTML = "";

    tags.forEach(function (tag, index) {
      var tagEl = document.createElement("div");
      tagEl.className = "profile-tag";

      var label = document.createElement("span");
      label.className = "poppins-extrabold";
      label.textContent = tag;
      tagEl.appendChild(label);

      var remove = document.createElement("button");
      remove.className = "tag-remove";
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove tag");
      remove.textContent = "x";
      remove.dataset.index = String(index);
      tagEl.appendChild(remove);

      container.appendChild(tagEl);
    });

    var input = document.createElement("input");
    input.type = "text";
    input.className = "tag-input poppins-regular";
    input.id = "newTagInput";
    input.placeholder = "Add or select a tag...";
    input.setAttribute("list", "tag-suggestions");

    var datalist = document.createElement("datalist");
    datalist.id = "tag-suggestions";
    
    var tagOptions = [
      "ID 125", "ID 124", "ID 123", "ID 122", "ID 121", "ID 120",
      "Study Group", "Tutor", "Cafe Enthusiast", "BS ORG!", "Matcha Lover",
      "Night Owl", "Early Bird", "Certified Foodie", "Gamer", "Artist", "Musician", 
      "Athlete", "Bookworm", "Traveler"
    ];
    
    tagOptions.forEach(function(optText) {
      if (tags.indexOf(optText) === -1) {
        var opt = document.createElement("option");
        opt.value = optText;
        datalist.appendChild(opt);
      }
    });

    container.appendChild(input);
    container.appendChild(datalist);

    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();

      var value = input.value.trim();
      if (!value) return;

      tags.push(value);
      input.value = "";
      renderEditableTags(container);
    });
  }

  function applyUserToForm() {
    if (nameInput) nameInput.value = user.username || "";
    if (bioInput) bioInput.value = user.bio || "";
    if (pronounsInput) setSelectValue(pronounsInput, user.pronouns || "");
    if (yearInput) setSelectValue(yearInput, user.year || "");
    if (majorInput) majorInput.value = user.major || "";
    if (avatarPreview) avatarPreview.src = user.photo || "assets/placeholder.png";
    tags = Array.isArray(user.tags) ? user.tags.slice() : [];
    renderEditableTags(tagsEdit);
  }

  async function loadCurrentUserData() {
    var resolved = null;

    if (typeof window.apiRequest === "function") {
      try {
        var mePayload = await window.apiRequest("/api/users/me", { method: "GET" });
        if (mePayload && mePayload.user) {
          resolved = mePayload.user;
        }
      } catch (error) {}
    }

    if (!resolved && typeof window.bootstrapMockDatabase === "function") {
      try {
        await window.bootstrapMockDatabase();
      } catch (error) {}
    }

    if (!resolved) {
      var latestDb = getDatabase();
      var latestUsers = Array.isArray(latestDb.users) ? latestDb.users : [];
      resolved = latestUsers.find(function (u) {
        if (!u) return false;
        var userId = String(u.id || u._id || "");
        return userId && userId === currentUserId;
      }) || null;
    }

    if (resolved) {
      user = Object.assign({}, user, resolved, {
        id: String(resolved.id || resolved._id || currentUserId || "")
      });
    }

    applyUserToForm();
  }

  renderEditableTags(tagsEdit);
  loadCurrentUserData();

  if (tagsEdit) {
    tagsEdit.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.classList.contains("tag-remove")) return;

      var index = Number(target.dataset.index);
      if (Number.isNaN(index)) return;

      tags.splice(index, 1);
      renderEditableTags(tagsEdit);
    });
  }

  var pendingAvatarDataUrl = ""; 
  let cropperInstance = null;
  let selectedAvatarFile = null;

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener("change", function () {
      var file = avatarInput.files && avatarInput.files[0];
      if (!file) return;
      selectedAvatarFile = file;

      var fileValidationError = validateProfilePhotoFile(file);
      if (fileValidationError) {
        AlertModal.show(fileValidationError, "error");
        avatarInput.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function (evt) {
        const modal = document.getElementById('global-cropper-modal');
        const image = document.getElementById('global-cropper-image');
        const cancelBtn = document.getElementById('global-cropper-cancel-btn');
        const saveBtn = document.getElementById('global-cropper-save-btn');

        image.src = evt.target.result;
        modal.style.display = 'flex';

        if (cropperInstance) {
          cropperInstance.destroy();
        }
        cropperInstance = new Cropper(image, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
        });

        cancelBtn.onclick = function() {
          modal.style.display = 'none';
          if(cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
          avatarInput.value = '';
          pendingAvatarDataUrl = "";
          selectedAvatarFile = null;
        };

        saveBtn.onclick = function() {
          if (!cropperInstance) return;
          const cropSize = getAdaptiveCropSize(cropperInstance);
          const canvas = cropperInstance.getCroppedCanvas({
            width: cropSize,
            height: cropSize,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
          });
          const outputMimeType = getOutputPhotoMimeType(selectedAvatarFile);
          pendingAvatarDataUrl = outputMimeType === "image/png"
            ? canvas.toDataURL(outputMimeType)
            : canvas.toDataURL(outputMimeType, 0.95);
          avatarPreview.src = pendingAvatarDataUrl;
          modal.style.display = 'none';
          cropperInstance.destroy();
          cropperInstance = null;
        };
      };
      reader.readAsDataURL(file);
    });
  }

  async function resetToDefaults() {
    user.username = "Username";
    user.bio = "Default bio";
    user.pronouns = "They/them";
    user.year = "2nd Year";
    user.major = "Software Technology";
    user.photo = "assets/profile-icon-default.png";
    user.tags = defaultTags.slice();

    // Update UI
    if (nameInput) nameInput.value = user.username;
    if (bioInput) bioInput.value = user.bio;
    if (pronounsInput) setSelectValue(pronounsInput, user.pronouns);
    if (yearInput) setSelectValue(yearInput, user.year);
    if (majorInput) majorInput.value = user.major;
    if (avatarPreview) avatarPreview.src = user.photo;

    tags = user.tags.slice();
    renderEditableTags(tagsEdit);

    pendingAvatarDataUrl = "";
    clearPasswordInputs();
    try {
      // PATCH: reset current user profile fields to defaults
      await window.apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          username: user.username,
          bio: user.bio,
          pronouns: user.pronouns,
          year: user.year,
          major: user.major,
          photo: user.photo,
          tags: user.tags
        })
      });
      await window.bootstrapMockDatabase();
    } catch (error) {}
    persistDatabase();

    if (typeof AlertModal !== "undefined") {
      AlertModal.show("Profile reset to default.", "success");
    }
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      resetToDefaults();
    });
  }

  saveButton.addEventListener("click", async function () {
    var nextName = nameInput ? nameInput.value.trim() : "";
    var nextBio = bioInput ? bioInput.value.trim() : "";
    var currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
    var newPassword = newPasswordInput ? newPasswordInput.value : "";
    var confirmNewPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
    var wantsPasswordChange = Boolean(currentPassword || newPassword || confirmNewPassword);

    if (wantsPasswordChange) {
      if (!currentPassword) {
        AlertModal.show("Please enter your current password.", "error");
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

      if (newPassword !== confirmNewPassword) {
        AlertModal.show("New password confirmation does not match.", "error");
        return;
      }
    }

    user.username = nextName;
    user.bio = nextBio;
    user.pronouns = getNormalizedSelectValue(pronounsInput);
    user.year = getNormalizedSelectValue(yearInput);
    user.major = majorInput ? majorInput.value.trim() : "";
    user.tags = tags.slice();

    if (pendingAvatarDataUrl) {
      user.photo = pendingAvatarDataUrl;
    }

    try {
      // PATCH: save edited current user profile fields
      var payload = await window.apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          username: user.username,
          bio: user.bio,
          pronouns: user.pronouns,
          year: user.year,
          major: user.major,
          photo: user.photo,
          tags: user.tags,
          currentPassword: wantsPasswordChange ? currentPassword : undefined,
          newPassword: wantsPasswordChange ? newPassword : undefined,
          confirmNewPassword: wantsPasswordChange ? confirmNewPassword : undefined
        })
      });

      if (payload && payload.user) {
        user = Object.assign({}, user, payload.user);
      }
      await window.bootstrapMockDatabase();
    } catch (error) {
      AlertModal.show(error.message || "Failed to save profile.", "error");
      return;
    }

    persistDatabase();

    if (wantsPasswordChange) {
      localStorage.removeItem("rememberMeToken");
      clearPasswordInputs();
    }

    if (typeof AlertModal !== "undefined") {
      AlertModal.show(wantsPasswordChange ? "Profile and password saved!" : "Profile saved!", "success");
    }

    window.location.href = "/profile";
  });
});
