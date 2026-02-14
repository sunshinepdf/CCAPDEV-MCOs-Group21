// Global sorting state
let sortMode = 'hot'; // 'hot' or 'top'
let timeFrame = 'today'; // 'today', 'week', 'month', 'year', 'alltime'

// Parse date string and return Date object
function parsePostDate(dateStr) {
    // Expected format: "Feb 4, 2026"
    return new Date(dateStr);
}

// Get votes received today for a post
function getVotesReceivedToday(postId) {
    const today = new Date('Feb 14, 2026').toDateString();
    const key = `votesReceived_${today}_${postId}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
}

// Track that a vote was received today
function trackVoteReceivedToday(postId) {
    const today = new Date('Feb 14, 2026').toDateString();
    const key = `votesReceived_${today}_${postId}`;
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(count + 1));
}

// Check if post date falls within timeframe
function isPostInTimeframe(post, timeframe) {
    const postDate = parsePostDate(post.date);
    const today = new Date('Feb 14, 2026'); // Current date
    const daysDiff = Math.floor((today - postDate) / (1000 * 60 * 60 * 24));
    
    switch(timeframe) {
        case 'today':
            return daysDiff === 0;
        case 'week':
            return daysDiff >= 0 && daysDiff < 7;
        case 'month':
            return daysDiff >= 0 && daysDiff < 30;
        case 'year':
            return daysDiff >= 0 && daysDiff < 365;
        case 'alltime':
            return true;
        default:
            return true;
    }
}

// Get posts sorted based on current mode and timeframe
function getSortedPosts() {
    let posts = mockDatabase.posts.map(post => ({
        ...post,
        score: (post.upvotes || 0) - (post.downvotes || 0),
        votesToday: getVotesReceivedToday(post.id)
    }));

    if (sortMode === 'hot') {
        // Hot: show all posts, sort by votes received today (most votes today first)
        // No date filtering - any post can appear if it got votes today
        return posts.sort((a, b) => b.votesToday - a.votesToday);
    } else {
        // Top: filter by timeframe, then sort by score
        posts = posts.filter(post => isPostInTimeframe(post, timeFrame));
        return posts.sort((a, b) => b.score - a.score);
    }
}

// Render posts dynamically from mockDatabase sorted by score using home page post-card format
function renderPopularPosts() {
    const postsContainer = document.querySelector('.paper-grid');
    
    // Safety check
    if (!postsContainer) {
        console.error('Posts container not found');
        return;
    }
    
    if (!mockDatabase || !mockDatabase.posts) {
        console.error('mockDatabase not available');
        return;
    }
    
    // Clear existing posts
    postsContainer.innerHTML = '';
    
    // Get posts with current sorting
    const sortedPosts = getSortedPosts();
    
    // Find user info for author
    function getUserById(userId) {
        const user = mockDatabase.users.find(u => u.id === userId);
        return user || { username: 'Unknown' };
    }

    function prettyCategory(cat) {
        const c = String(cat || "").toLowerCase();
        if (c === "news") return "News";
        if (c === "help") return "Help";
        return "Discussion";
    }

    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
    
    // Render each post in home post format
    sortedPosts.forEach((post, index) => {
        const user = getUserById(post.authorId);
        const score = post.score;
        
        const postElement = document.createElement('article');
        postElement.className = 'article' + (index === 0 ? ' lead' : '');
        postElement.dataset.postId = post.id;
        
        postElement.innerHTML = 
            '<div class="section-row poppins-regular">' +
                '<span>' + prettyCategory(post.category || "discussion") + '</span>' +
                '<span>' + (post.views || 0) + ' views</span>' +
            '</div>' +
            '<h2 class="headline poppins-extrabold">' + escapeHtml(post.title) + '</h2>' +
            /* Changed the raw dot to &bull; */
            '<div class="byline poppins-regular">By <b>' + escapeHtml(user.username) + '</b> &bull; ' + escapeHtml(post.date) + '</div>' +
            '<div class="rule"></div>' +
            '<p class="excerpt poppins-regular">' + escapeHtml(post.content) + '</p>' +
            '<div class="article-actions">' +
                '<span class="chip poppins-regular">Score: <b>' + score + '</b></span>' +
                '<div class="vote">' +
                    /* Using Entities for arrows to ensure they stay fixed */
                    '<button type="button" data-action="up" data-id="' + escapeHtml(post.id) + '">&#9650;</button>' +
                    '<button type="button" data-action="down" data-id="' + escapeHtml(post.id) + '">&#9660;</button>' +
                '</div>' +
                '<button class="open-btn" type="button" data-action="open" data-id="' + escapeHtml(post.id) + '">Open</button>' +
            '</div>';
        
        postsContainer.appendChild(postElement);
    });
    
    // Attach event handlers to vote and open buttons
    document.querySelectorAll('.vote button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentUserId = localStorage.getItem("currentUserId");
            if (!currentUserId) {
                AlertModal.show("Please login or sign up to view more posts and interact.", "error");
                return;
            }
            const postId = btn.dataset.id;
            const direction = btn.dataset.action === 'up' ? 1 : -1;
            voteOnPost(postId, direction);
        });
    });

    document.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentUserId = localStorage.getItem("currentUserId");
            if (!currentUserId) {
                AlertModal.show("Please login or sign up to view more posts and interact.", "error");
                return;
            }
            
            // Update view count
            const postId = btn.dataset.id;
            const post = mockDatabase.posts.find(p => p.id === postId);
            if (post) {
                post.views = (Number(post.views) || 0) + 1;
                localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
            }
            
            AlertModal.show("Opened post (views updated)!", "success");
            renderPopularPosts();
        });
    });
}

// Handle voting on posts
function voteOnPost(postId, direction) {
    const currentUserId = localStorage.getItem("currentUserId") || "u1";
    const votesKey = "votes_" + currentUserId;
    const votes = JSON.parse(localStorage.getItem(votesKey) || '{}');
    
    const prev = Number(votes[postId] || 0);
    const next = (prev === direction) ? 0 : direction;
    
    const post = mockDatabase.posts.find(p => p.id === postId);
    if (!post) return;
    
    if (prev === 1) post.upvotes = (Number(post.upvotes) || 0) - 1;
    if (prev === -1) post.downvotes = (Number(post.downvotes) || 0) - 1;
    
    if (next === 1) {
        post.upvotes = (Number(post.upvotes) || 0) + 1;
        trackVoteReceivedToday(postId); // Track this vote as received today
    }
    if (next === -1) post.downvotes = (Number(post.downvotes) || 0) + 1;
    
    if (next === 0) delete votes[postId];
    else votes[postId] = next;
    
    localStorage.setItem(votesKey, JSON.stringify(votes));
    localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
    
    AlertModal.show("Vote updated!", "success");
    
    // Re-render to update scores
    renderPopularPosts();
}

// Handle sort mode change
function changeSortMode(mode) {
    sortMode = mode;
    const timeframeDropdown = document.getElementById('timeframeDropdown');
    if (mode === 'top') {
        timeframeDropdown.style.display = 'inline-block';
    } else {
        timeframeDropdown.style.display = 'none';
    }
    renderPopularPosts();
}

// Handle timeframe change
function changeTimeframe(frame) {
    timeFrame = frame;
    renderPopularPosts();
}

// Load posts on page load
document.addEventListener('DOMContentLoaded', renderPopularPosts);
