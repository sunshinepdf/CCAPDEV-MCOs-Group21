document.addEventListener("DOMContentLoaded", function () {
    var storageKey = "animoProfile";

    function loadProfileData() {
        try {
            var raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            return {};
        }
    }

    function saveProfileData(data) {
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    var data = loadProfileData();

    var nameEl = document.getElementById("profile-name");
    var aboutTitleEl = document.getElementById("profile-about-title");
    var bioEl = document.getElementById("profile-bio");
    var pronounsEl = document.getElementById("profile-pronouns");
    var yearEl = document.getElementById("profile-year");
    var majorEl = document.getElementById("profile-major");
    var avatarEl = document.getElementById("profile-avatar-img");
    var tagsView = document.getElementById("profile-tags");

    if (nameEl && data.name) {
        nameEl.textContent = data.name;
    }
    if (aboutTitleEl && data.aboutTitle) {
        aboutTitleEl.textContent = data.aboutTitle;
    }
    if (bioEl && data.bio) {
        bioEl.textContent = data.bio;
    }
    if (pronounsEl && data.pronouns) {
        pronounsEl.textContent = data.pronouns;
    }
    if (yearEl && data.year) {
        yearEl.textContent = data.year;
    }
    if (majorEl && data.major) {
        majorEl.textContent = data.major;
    }
    if (avatarEl && data.avatar) {
        avatarEl.src = data.avatar;
    }

    var defaultTags = ["CCS", "ID 124", "Friendly"];
    var tags = Array.isArray(data.tags) && data.tags.length ? data.tags.slice() : defaultTags.slice();

    function renderTags(container, editable) {
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

            if (editable) {
                var remove = document.createElement("button");
                remove.className = "tag-remove";
                remove.type = "button";
                remove.setAttribute("aria-label", "Remove tag");
                remove.textContent = "x";
                remove.dataset.index = String(index);
                tagEl.appendChild(remove);
            }

            container.appendChild(tagEl);
        });

        if (editable) {
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
                renderTags(container, true);
            });
        }
    }

    renderTags(tagsView, false);

    var saveButton = document.getElementById("save-profile");
    if (!saveButton) {
        return;
    }
    var resetButton = document.getElementById("reset-profile");

    var nameInput = document.getElementById("edit-name");
    var aboutTitleInput = document.getElementById("edit-about-title");
    var bioInput = document.getElementById("edit-bio");
    var pronounsInput = document.getElementById("edit-pronouns");
    var yearInput = document.getElementById("edit-year");
    var majorInput = document.getElementById("edit-major");
    var avatarInput = document.getElementById("edit-avatar");
    var avatarPreview = document.getElementById("edit-avatar-preview");
    var tagsEdit = document.getElementById("edit-tags");

    if (nameInput && data.name) {
        nameInput.value = data.name;
    }
    if (aboutTitleInput && data.aboutTitle) {
        aboutTitleInput.value = data.aboutTitle;
    }
    if (bioInput && data.bio) {
        bioInput.value = data.bio;
    }
    if (pronounsInput && data.pronouns) {
        pronounsInput.value = data.pronouns;
    }
    if (yearInput && data.year) {
        yearInput.value = data.year;
    }
    if (majorInput && data.major) {
        majorInput.value = data.major;
    }
    if (avatarPreview && data.avatar) {
        avatarPreview.src = data.avatar;
    }
    renderTags(tagsEdit, true);

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
            renderTags(tagsEdit, true);
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

    var defaultData = {
        name: "Username",
        aboutTitle: "About Me",
        bio: "This is a sample bio for the user profile. You can edit this bio to share more about yourself, your interests, and anything else you'd like others to know! Feel free to make it as long or as short as you'd like.",
        pronouns: "They/Them",
        year: "2nd Year",
        major: "Software Technology",
        tags: defaultTags.slice()
    };

    function applyDefaultValues() {
        if (nameInput) {
            nameInput.value = defaultData.name;
        }
        if (aboutTitleInput) {
            aboutTitleInput.value = defaultData.aboutTitle;
        }
        if (bioInput) {
            bioInput.value = defaultData.bio;
        }
        if (pronounsInput) {
            pronounsInput.value = defaultData.pronouns;
        }
        if (yearInput) {
            yearInput.value = defaultData.year;
        }
        if (majorInput) {
            majorInput.value = defaultData.major;
        }
        if (avatarPreview) {
            avatarPreview.src = "assets/placeholder.png";
        }
        tags = defaultData.tags.slice();
        renderTags(tagsEdit, true);
        data.avatar = "";
    }

    if (resetButton) {
        resetButton.addEventListener("click", function () {
            localStorage.removeItem(storageKey);
            applyDefaultValues();
            saveProfileData(defaultData);
        });
    }

    saveButton.addEventListener("click", function () {
        var nextData = {
            name: nameInput ? nameInput.value.trim() : "",
            aboutTitle: aboutTitleInput ? aboutTitleInput.value.trim() : "",
            bio: bioInput ? bioInput.value.trim() : "",
            pronouns: pronounsInput ? pronounsInput.value.trim() : "",
            year: yearInput ? yearInput.value.trim() : "",
            major: majorInput ? majorInput.value.trim() : "",
            tags: tags.slice()
        };
        if (data.avatar) {
            nextData.avatar = data.avatar;
        }
        saveProfileData(nextData);
        window.location.href = "profile.html";
    });
});
