document.addEventListener("DOMContentLoaded", function () {
	var form = document.getElementById("login-form");
	var usernameInput = document.getElementById("username");
	var passwordInput = document.getElementById("password");
	var rememberMeCheckbox = document.getElementById("remember-me");

	// Testing: 10 minutes | Production: 3 * 7 * 24 * 60 * 60 * 1000 (3 weeks)
	var THREE_WEEKS_MS = 3 * 7 * 24 * 60 * 60 * 1000;

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

	function findUserByUsername(db, username) {
		if (!db || !Array.isArray(db.users)) {
			return null;
		}
		return db.users.find(function (user) {
			return user && user.username === username;
		}) || null;
	}

	function getRememberMeToken() {
		try {
			var token = localStorage.getItem("rememberMeToken");
			if (!token) return null;
			return JSON.parse(token);
		} catch (error) {
			return null;
		}
	}

	function saveRememberMeToken(username, password) {
		var token = {
			username: username,
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

	function performLogin(username, password) {
		var db = getDatabase();
		var user = findUserByUsername(db, username);
		if (!user) {
			return false;
		}

		if (!password || user.password !== password) {
			return false;
		}

		localStorage.setItem("currentUserId", user.id);
		return true;
	}

	function autoLoginWithRememberMe() {
		if (!isRememberMeValid()) {
			clearRememberMeToken();
			return false;
		}

		var token = getRememberMeToken();
		if (performLogin(token.username, token.password)) {
			updateRememberMeExpiration();
			return true;
		} else {
			clearRememberMeToken();
			return false;
		}
	}

	// Check for valid remember me token on page load
	if (form && autoLoginWithRememberMe()) {
		window.location.href = "home.html";
		return;
	}

	if (!form) {
		return;
	}

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		var username = usernameInput ? usernameInput.value.trim() : "";
		if (!username) {
			AlertModal.show("Please enter a username.", "error");
			return;
		}

		var password = passwordInput ? passwordInput.value : "";
		if (!performLogin(username, password)) {
			AlertModal.show("Invalid credentials. Please check your username and/or password. If you don't have an account, please sign up first.", "error");
			return;
		}

		var rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
		if (rememberMe) {
			saveRememberMeToken(username, password);
		} else {
			clearRememberMeToken();
		}

		if (passwordInput) {
			passwordInput.value = "";
		}
		window.location.href = "home.html";
	});
});
