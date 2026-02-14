// Sets the current user ID based on localStorage, defaulting to "u1" if not set
var CURRENT_USER_ID = localStorage.getItem("currentUserId") || "u1";

// Fetches the mock database from localStorage
const savedData = JSON.parse(localStorage.getItem('mockDatabase'));

// Loads the hardcoded default database and merges it with any saved data from localStorage 
// (i.e. if a new user was created, it will be added to the default users)
const defaultDatabase = {
    // Array of user objects with properties like id, username, email, password, etc.
    users: [
        {
            id: "u1",
            username: "CCAPDEV-G21",
            email: "ccapdev.group21@dlsu.edu.ph",
            password: "ccapdevgroup21",
            photo: "assets/placeholder.png",
            year: "2nd Year",
            pronouns: "they/them",
            major: "BS - Computer Science",
            bio: "Hello! We are the developers of Animo Commons! This website is a project for our CCAPDEV class, and we hope it can be a fun and helpful resource for students at DLSU. Feel free to explore and connect with others in the community!",
            tags:["Site Devs", "CCS", "ID 124"],
            stats: { posts: 3, reputation: 50 }
        },
        {
            id: "u2",
            username: "user167",
            email: "user167@dlsu.edu.ph",
            password: "password123",
            photo: "assets/placeholder.png",
            year: "1st Year",
            pronouns: "he/him",
            major: "BS - Biology Major in Medical Biology",
            bio: "Just a regular student trying to navigate college life!",
            tags:["COS", "ID 125"],
            stats: { posts: 2, reputation: 34 }
        },
        {
            id: "u3",
            username: "JaneDoe",
            email: "jane.doe@dlsu.edu.ph",
            password: "securepass",
            photo: "assets/placeholder.png",
            year: "3rd Year",
            pronouns: "she/her",
            major: "BS - Information Technology",
            bio: "Loves coding and coffee! Always up for a good challenge.",
            tags:["CCS", "ID 123", "Friendly"],
            stats: { posts: 5, reputation: 78 }
        },
        {
            id: "u4",
            username: "urmom",
            email: "psychology.student@dlsu.edu.ph",
            password: "password",
            photo: "assets/placeholder.png",
            year: "4th Year",
            pronouns: "he/him",
            major: "BS - Psychology",
            bio: "Passionate about mental health advocacy and understanding the human mind.",
            tags:["CLA", "ID 122", "Helpful"],
            stats: { posts: 8, reputation: 120 }
        },
        {
            id: "u5",
            username: "JohnSmith",
            email: "john.smith@dlsu.edu.ph",
            password: "johnspassword",
            photo: "assets/placeholder.png",
            year: "2nd Year",
            pronouns: "he/him",
            major: "BSMS - Computer Science",
            bio: "Aspiring software engineer with a love for problem-solving and innovation.",
            tags:["CCS", "ID 124", "Tech Enthusiast"],
            stats: { posts: 4, reputation: 60 }
        }
    ],

    // Array of post objects with properties like id, authorId, title, content, date, upvotes, downvotes, etc.
    posts: [
        { id: "p1", authorId: "u1", category: "help", title: "CCAPDEV Help", content: "Can someone explain how to properly structure our project files for Phase 1? I'm having trouble organizing the components.", date: "Feb 4, 2026", views: 120, upvotes: 12, downvotes: 1 },
        { id: "p2", authorId: "u2", category: "news", title: "Campus Events", content: "Don't forget about the DLSU Career Fair happening next week! Great opportunities for internships and networking.", date: "Feb 5, 2026", views: 200, upvotes: 4, downvotes: 2 },
        { id: "p3", authorId: "u1", category: "discussion", title: "Study Group", content: "Forming a study group for Data Structures. Meeting every Tuesday and Thursday at the library. Anyone interested?", date: "Feb 6, 2026", views: 95, upvotes: 7, downvotes: 0 },
        { id: "p4", authorId: "u3", category: "discussion", title: "Project Ideas", content: "Here are some innovative project ideas for your CCAPDEV assignments. Feel free to discuss and build upon them!", date: "Feb 7, 2026", views: 180, upvotes: 15, downvotes: 3 },
        { id: "p5", authorId: "u4", category: "help", title: "Mental Health Resources", content: "The student wellness center offers free counseling. Taking care of your mental health is important during stressful semesters!", date: "Feb 8, 2026", views: 310, upvotes: 20, downvotes: 1 },
        { id: "p6", authorId: "u5", category: "news", title: "Internship Opportunities", content: "Acme Corp is hiring interns for summer! Great experience working with real-world projects. Apply before Feb 28.", date: "Feb 9, 2026", views: 250, upvotes: 10, downvotes: 0 },
        { id: "p7", authorId: "u1", category: "discussion", title: "Tips for Web Development", content: "I've compiled a list of useful web development tools and frameworks. Check it out and share your favorites!", date: "Feb 10, 2026", views: 215, upvotes: 18, downvotes: 2 },
        { id: "p8", authorId: "u3", category: "discussion", title: "Best Coffee Spots Near Campus", content: "Found this amazing coffee shop a 5-minute walk from campus. Perfect for studying or just relaxing between classes.", date: "Feb 11, 2026", views: 290, upvotes: 23, downvotes: 1 },
        { id: "p9", authorId: "u2", category: "discussion", title: "Database Design Best Practices", content: "Let's discuss the best practices for designing efficient databases. I'm planning to implement this in our project.", date: "Feb 6, 2026", views: 165, upvotes: 14, downvotes: 2 },
        { id: "p10", authorId: "u4", category: "help", title: "JavaScript Async/Await Guide", content: "A comprehensive guide to understanding async/await in JavaScript. No more callback hell! Questions are welcome.", date: "Feb 7, 2026", views: 340, upvotes: 25, downvotes: 3 },
        { id: "p11", authorId: "u5", category: "help", title: "Version Control with Git", content: "Everyone should learn Git properly. Here's a tutorial covering branches, merges, and handling conflicts.", date: "Feb 8, 2026", views: 270, upvotes: 19, downvotes: 1 },
        { id: "p12", authorId: "u1", category: "discussion", title: "Debugging Techniques", content: "Share your favorite debugging techniques! I usually use console.log, but I want to learn more efficient methods.", date: "Feb 9, 2026", views: 145, upvotes: 11, downvotes: 4 },
        { id: "p13", authorId: "u2", category: "discussion", title: "UX Design Principles", content: "Let's discuss what makes good user experience design. I'm working on improving the UI of my project.", date: "Feb 10, 2026", views: 190, upvotes: 16, downvotes: 2 },
        { id: "p14", authorId: "u3", category: "help", title: "Mobile App Development", content: "Anyone interested in developing mobile apps? I'm starting to learn React Native and looking for study partners.", date: "Feb 4, 2026", views: 130, upvotes: 9, downvotes: 1 },
        { id: "p15", authorId: "u4", category: "discussion", title: "Testing and Quality Assurance", content: "Good testing practices can save so much time later. Let's share our favorite testing frameworks and strategies.", date: "Feb 5, 2026", views: 155, upvotes: 13, downvotes: 2 },
        { id: "p16", authorId: "u5", category: "news", title: "Cloud Deployment Options", content: "Comparing AWS, Azure, and Google Cloud. Which platform do you prefer for deploying your projects?", date: "Feb 8, 2026", views: 205, upvotes: 17, downvotes: 3 },
        { id: "p17", authorId: "u1", category: "discussion", title: "API Design Discussion", content: "Let's talk about designing clean and intuitive REST APIs. I'm struggling with endpoint organization in my project.", date: "Feb 9, 2026", views: 175, upvotes: 12, downvotes: 1 },
        { id: "p18", authorId: "u2", category: "help", title: "Security Best Practices", content: "Important security considerations when building web applications. Never forget to sanitize user input!", date: "Feb 10, 2026", views: 320, upvotes: 22, downvotes: 2 },
        { id: "p19", authorId: "u3", category: "discussion", title: "Code Review Tips", content: "How to give constructive code reviews without being harsh. Communication is key in collaborative development.", date: "Feb 11, 2026", views: 240, upvotes: 20, downvotes: 1 },
        { id: "p20", authorId: "u4", category: "discussion", title: "Performance Optimization", content: "Techniques for optimizing application performance. Profiling tools have been a game-changer for me.", date: "Feb 12, 2026", views: 300, upvotes: 26, downvotes: 2 }
    ]
};

// Function to merge saved data with default data, ensuring that new users are added and 
// existing users are updated without losing any information
function mergeWithDefaults(saved, defaults) {
    if (!saved) return defaults;
    
    // Start with default users merged with saved data
    var mergedUsers = (defaults.users || []).map(function (defaultUser) {
        var savedUser = (saved.users || []).find(function (u) {
            return u && u.id === defaultUser.id;
        });
        return savedUser ? Object.assign({}, defaultUser, savedUser) : defaultUser;
    });
    
    // Add any new users from saved data that don't exist in defaults
    if (saved.users && Array.isArray(saved.users)) {
        saved.users.forEach(function (savedUser) {
            var existsInDefaults = (defaults.users || []).some(function (u) {
                return u && u.id === savedUser.id;
            });
            if (!existsInDefaults) {
                mergedUsers.push(savedUser);
            }
        });
    }
    
    // Return the merged database object, ensuring that posts are also included from saved data if available
    return {
        ...defaults,
        users: mergedUsers,
        posts: saved.posts || defaults.posts || []
    };
}

// Create the mock database by merging saved data with defaults, ensuring that any new users or posts are preserved
const mockDatabase = mergeWithDefaults(savedData, defaultDatabase);

// Function to save the current state of the mock database back to localStorage
function saveToLocalDB() {
    localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
}

// Logout function to clear current user session and redirect to login page
function logout() {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("rememberMeToken");
    window.location.href = "login.html";
}