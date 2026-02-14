document.addEventListener("DOMContentLoaded", function () {
    var storageKey = "animoProfile"; // Key used for storing profile data in localStorage

    // Function to parse JSON safely, returning null if parsing fails
    function parseJson(value) {
        try {
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }

    // Function to get the mock database from localStorage, or return null if not available
    function getDatabase() {
        var localDb = parseJson(localStorage.getItem("mockDatabase"));
        return typeof mockDatabase !== "undefined" ? mockDatabase : localDb;
    }

    // Function to get the current user's ID, defaulting to "u1" if not set
    function getCurrentUserId() {
        return typeof CURRENT_USER_ID !== "undefined" ? CURRENT_USER_ID : "u1";
    }

    // Function to load the current user's profile data, 
    // first trying the mock database and falling back to localStorage if not found
    function loadProfileData() {
        var db = getDatabase();
        var currentUserId = getCurrentUserId();

        // Attempt to find the current user's data in the mock database
        if (db && Array.isArray(db.users)) {
            var user = db.users.find(function (item) {
                return item && item.id === currentUserId;
            });
            // If user data is found in the database, return a structured profile object
            if (user) {
                return {
                    name: user.username || "",
                    bio: user.bio || "",
                    pronouns: user.pronouns || "",
                    year: user.year || "",
                    major: user.major || "",
                    avatar: user.photo || "",
                    tags: Array.isArray(user.tags) ? user.tags.slice() : []
                };
            }
        }

        var localProfile = parseJson(localStorage.getItem(storageKey));
        return localProfile || {};
    }

    // Function to save the current user's profile data to localStorage under a specific key
    function saveProfileData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    var data = loadProfileData();

    var saveButton = document.getElementById("save-profile-edits");
    if (!saveButton) {
        return;
    }
    var resetButton = document.getElementById("reset-profile-to-default");

    var nameInput = document.getElementById("edit-name");
    var bioInput = document.getElementById("edit-bio");
    var pronounsInput = document.getElementById("edit-pronouns");
    var yearInput = document.getElementById("edit-year");
    var majorInput = document.getElementById("edit-major");
    var avatarInput = document.getElementById("upload-profile-photo");
    var avatarPreview = document.getElementById("user-profile-photo");
    var tagsEdit = document.getElementById("edit-tags");

    if (nameInput && data.name) {
        nameInput.value = data.name;
    }
    if (bioInput && data.bio) {
        bioInput.value = data.bio;
    }


    function setSelectValue(selectEl, value) {
        if (!selectEl || !value) {
            return;
        }
        var normalized = String(value).toLowerCase();
        var options = Array.prototype.slice.call(selectEl.options);
        var match = options.find(function (option) {
            return option.value.toLowerCase() === normalized;
        });
        if (match) {
            selectEl.value = match.value;
        } else {
            selectEl.value = value;
        }
    }

    function getNormalizedSelectValue(selectEl) {
        if (!selectEl) {
            return "";
        }
        var rawValue = String(selectEl.value || "");
        var normalized = rawValue.toLowerCase();
        var options = Array.prototype.slice.call(selectEl.options);
        var match = options.find(function (option) {
            return option.value.toLowerCase() === normalized;
        });
        return match ? match.value : rawValue;
    }

    if (pronounsInput && data.pronouns) {
        setSelectValue(pronounsInput, data.pronouns);
    }
    if (yearInput && data.year) {
        setSelectValue(yearInput, data.year);
    }
    if (majorInput && data.major) {
        majorInput.value = data.major;
    }
    if (avatarPreview && data.avatar) {
        avatarPreview.src = data.avatar;
    }

    var defaultTags = ["CCS", "ID 124", "Friendly"];
    var tags = Array.isArray(data.tags) && data.tags.length ? data.tags.slice() : defaultTags.slice();

    function renderEditableTags(container) {
        if (!container) {
            return;
        }
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
        input.className = "tag-input";
        input.id = "newTagInput";
        input.placeholder = "Add a tag...";
        container.appendChild(input);

        input.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") {
                return;
            }
            event.preventDefault();
            var value = input.value.trim();
            if (!value) {
                return;
            }
            tags.push(value);
            input.value = "";
            renderEditableTags(container);
        });
    }

    renderEditableTags(tagsEdit);

    if (tagsEdit) {
        tagsEdit.addEventListener("click", function (event) {
            var target = event.target;
            if (!target || !target.classList.contains("tag-remove")) {
                return;
            }
            var index = Number(target.dataset.index);
            if (Number.isNaN(index)) {
                return;
            }
            tags.splice(index, 1);
            renderEditableTags(tagsEdit);
        });
    }

    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener("change", function () {
            var file = avatarInput.files && avatarInput.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                avatarPreview.src = String(reader.result);
                data.avatar = String(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Function to get the default user data from the mock database based on the current user ID,
    // or return hardcoded defaults if not found, ensuring that the profile can be reset to these values
    function getDefaultUserData() {
        var currentUserId = typeof CURRENT_USER_ID !== "undefined" ? CURRENT_USER_ID : "u1";
        var db = typeof defaultDatabase !== "undefined" ? defaultDatabase : null;
        if (db && Array.isArray(db.users)) {
            var user = db.users.find(function (item) {
                return item && item.id === currentUserId;
            });
            if (user) {
                return {
                    name: user.username || "",
                    bio: user.bio || "",
                    pronouns: user.pronouns || "",
                    year: user.year || "",
                    major: user.major || "",
                    avatar: user.photo || "",
                    tags: Array.isArray(user.tags) ? user.tags.slice() : []
                };
            }
        }
        return {
            name: "Username",
            bio: "Default bio",
            pronouns: "They/Them",
            year: "2nd Year",
            major: "Software Technology",
            tags: defaultTags.slice()
        };
    }

    function applyDefaultValues() {
        var defaultData = getDefaultUserData();
        if (nameInput) {
            nameInput.value = defaultData.name;
        }
        if (bioInput) {
            bioInput.value = defaultData.bio;
        }
        if (pronounsInput) {
            setSelectValue(pronounsInput, defaultData.pronouns);
        }
        if (yearInput) {
            setSelectValue(yearInput, defaultData.year);
        }
        if (majorInput) {
            majorInput.value = defaultData.major;
        }
        if (avatarPreview) {
            avatarPreview.src = defaultData.avatar || "assets/placeholder.png";
        }
        tags = defaultData.tags.slice();
        renderEditableTags(tagsEdit);
        data.avatar = defaultData.avatar || "";
    }

    if (resetButton) {
        resetButton.addEventListener("click", function () {
            localStorage.removeItem(storageKey);
            localStorage.removeItem('mockDatabase');
            applyDefaultValues();
            var defaultData = getDefaultUserData();
            saveProfileData(defaultData);
        });
    }

    saveButton.addEventListener("click", function () {
        var nextData = {
            name: nameInput ? nameInput.value.trim() : "",
            bio: bioInput ? bioInput.value.trim() : "",
            pronouns: getNormalizedSelectValue(pronounsInput),
            year: getNormalizedSelectValue(yearInput),
            major: majorInput ? majorInput.value.trim() : "",
            tags: tags.slice()
        };
        if (data.avatar) {
            nextData.avatar = data.avatar;
        }
        saveProfileData(nextData);

        var currentUserId = typeof CURRENT_USER_ID !== "undefined" ? CURRENT_USER_ID : "u1";
        var db = typeof mockDatabase !== "undefined" ? mockDatabase : null;
        if (db && Array.isArray(db.users)) {
            var user = db.users.find(function (item) {
                return item && item.id === currentUserId;
            });
            if (user) {
                user.username = nextData.name || "";
                user.bio = nextData.bio || "";
                user.pronouns = nextData.pronouns || "";
                user.year = nextData.year || "";
                user.major = nextData.major || "";
                user.tags = nextData.tags.slice();
                if (nextData.avatar) {
                    user.photo = nextData.avatar;
                }
                if (typeof saveToLocalDB === "function") {
                    saveToLocalDB();
                }
            }
        }

        window.location.href = "profile.html";
    });
});
