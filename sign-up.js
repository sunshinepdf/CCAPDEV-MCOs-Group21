document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("sign-up-form");
    var usernameInput = document.getElementById("username");
    var emailInput = document.getElementById("email");
    var passwordInput = document.getElementById("password");

    // Function to create a modal element for displaying error/success messages to the user
    function createModal() {
        var overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.id = "signup-modal";
        
        var content = document.createElement("div");
        content.className = "modal-content";
        
        var icon = document.createElement("div");
        icon.className = "modal-icon";
        
        var message = document.createElement("p");
        message.className = "modal-message poppins-regular";
        
        var button = document.createElement("button");
        button.className = "modal-button poppins-regular";
        button.textContent = "OK";
        
        content.appendChild(icon);
        content.appendChild(message);
        content.appendChild(button);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        return { overlay: overlay, content: content, icon: icon, message: message, button: button };
    }
    
    // Initialize the modal for displaying messages to the user
    var modal = createModal();
    
    // Function to show the modal with a specific message and type (error or success)
    function showModal(msg, type) {
        modal.message.textContent = msg;
        modal.content.className = "modal-content " + type;
    
        if (type === "error") {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#f44336"/><path d="M20 20 L40 40 M40 20 L20 40" stroke="white" stroke-width="4" stroke-linecap="round"/></svg>';
        } else {
            modal.icon.innerHTML = '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#4CAF50"/><path d="M15 30 L25 40 L45 20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
        }
        
        modal.overlay.classList.add("show");
    }
    
    // Function to hide the modal when the user clicks the OK button or outside the modal content
    function hideModal() {
        modal.overlay.classList.remove("show");
    }
    
    // Add event listeners to the modal button and overlay for hiding the modal
    modal.button.addEventListener("click", hideModal);
    modal.overlay.addEventListener("click", function(e) {
        if (e.target === modal.overlay) {
            hideModal();
        }
    });

    // Function to get the mock database from localStorage, or return null if not available
    function getDatabase() {
        if (typeof mockDatabase !== "undefined") {
            return mockDatabase;
        }
        try {
            var raw = localStorage.getItem("mockDatabase");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    // Function to save the current state of the mock database back to localStorage
    function saveDatabase(db) {
        localStorage.setItem("mockDatabase", JSON.stringify(db));
    }

    // Function to generate a new unique user ID based on existing users in the database
    // prevents ID collisions by incrementing the highest existing user ID number
    function generateUserId(db) {
        if (!db || !Array.isArray(db.users)) {
            return "u1";
        }
        
        var maxId = 0;
        db.users.forEach(function (user) {
            if (user && user.id) {
                var match = user.id.match(/^u(\d+)$/);
                if (match) {
                    var num = parseInt(match[1], 10);
                    if (num > maxId) {
                        maxId = num;
                    }
                }
            }
        });
        
        return "u" + (maxId + 1);
    }

    // Function to check if a username already exists in the database
    function usernameExists(db, username) {
        if (!db || !Array.isArray(db.users)) {
            return false;
        }
        return db.users.some(function (user) {
            return user && user.username === username;
        });
    }

    // Function to check if an email already exists in the database
    function emailExists(db, email) {
        if (!db || !Array.isArray(db.users)) {
            return false;
        }
        return db.users.some(function (user) {
            return user && user.email === email;
        });
    }

    // Function to create a new user object with the provided information and default values for other properties
    function createNewUser(userId, username, email, password) {
        return {
            id: userId,
            username: username,
            email: email,
            password: password,
            photo: "assets/placeholder.png",
            year: "",
            pronouns: "",
            major: "",
            bio: "",
            tags: [],
            stats: { posts: 0, reputation: 0 }
        };
    }

    // Event listener for form submission to handle user sign-up logic, 
    // including validation, database updates, and user feedback through modals
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var username = usernameInput.value.trim();
        var email = emailInput.value.trim();
        var password = passwordInput.value;

        // Basic validation
        if (!username || !email || !password) {
            AlertModal.show("Please fill in all fields!", "error");
            return;
        }

        if (password.length < 6) {
            AlertModal.show("Password must be at least 6 characters long!", "error");
            return;
        }

        // Get database
        var db = getDatabase();
        if (!db) {
            AlertModal.show("Error: Could not access database!", "error");
            return;
        }

        // Check if username already exists
        if (usernameExists(db, username)) {
            AlertModal.show("Username already exists! Please choose a different username.", "error");
            return;
        }

        // Check if email already exists
        if (emailExists(db, email)) {
            AlertModal.show("Email already registered! Please use a different email or login.", "error");
            return;
        }

        // Create new user
        var newUserId = generateUserId(db);
        var newUser = createNewUser(newUserId, username, email, password);

        // Add user to database
        db.users.push(newUser);
        saveDatabase(db);

        // Set as current user
        localStorage.setItem("currentUserId", newUserId);

        AlertModal.show("Account created successfully! Welcome to Animo Commons!", "success");

        // Redirect to home page after a short delay
        setTimeout(function() {
            window.location.href = "home.html";
        }, 1500);
    });
});
