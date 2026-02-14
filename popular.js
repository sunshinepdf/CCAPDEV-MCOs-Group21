let sortMode = 'hot'; // Default mode
let timeFrame = 'today'; // Default timeframe for 'Top'

// DATE HELPERS
function parsePostDate(dateStr) {
    return new Date(dateStr);
}

// Track votes per day (for background analytics)
function trackVoteReceivedToday(postId) {
    const today = new Date().toDateString();
    const key = `votesReceived_${today}_${postId}`;
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(count + 1));
}

// FILTERING LOGIC
function isPostInTimeframe(post, timeframe) {
    const postDate = parsePostDate(post.date);
    const today = new Date();
    
    // Normalize to midnight for calendar comparison
    today.setHours(0, 0, 0, 0);
    postDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - postDate) / (1000 * 60 * 60 * 24));
    
    switch(timeframe) {
        case 'today':   return daysDiff === 0;
        case 'week':    return daysDiff >= 0 && daysDiff < 7;
        case 'month':   return daysDiff >= 0 && daysDiff < 30;
        case 'year':    return daysDiff >= 0 && daysDiff < 365;
        case 'alltime': return true;
        default:        return true;
    }
}

// SORTING LOGIC
function getSortedPosts() {
    // Map current scores and ensure interaction timestamps exist
    let posts = mockDatabase.posts.map(post => ({
        ...post,
        score: (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0),
        lastInteraction: post.lastInteraction || 0 // Used for 'Hot' sorting
    }));

    if (sortMode === 'hot') {
        // "Hot" = Most recently voted/interacted with posts first
        return posts.sort((a, b) => b.lastInteraction - a.lastInteraction);
    } else {
        // "Top" = Filter by timeframe, then sort by highest score
        posts = posts.filter(post => isPostInTimeframe(post, timeFrame));
        return posts.sort((a, b) => b.score - a.score);
    }
}

// RENDERING ENGINE
function renderPopularPosts() {
    const postsContainer = document.querySelector('.paper-grid');
    const popularDate = document.getElementById('popularDate');

    if (!postsContainer) return;

    // Update Title Bar Date to Current Date
    if (popularDate) {
        popularDate.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
    }

    postsContainer.innerHTML = '';
    const sortedPosts = getSortedPosts();
    
    sortedPosts.forEach((post, index) => {
        const user = mockDatabase.users.find(u => u.id === post.authorId) || { username: "Unknown" };
        const postElement = document.createElement('article');
        postElement.className = 'article' + (index === 0 ? ' lead' : '');
        
        postElement.innerHTML = `
            <div class="section-row poppins-regular">
                <span>${post.category.toUpperCase()}</span>
                <span>${post.views || 0} views</span>
            </div>
            <h2 class="headline poppins-extrabold">${post.title}</h2>
            <div class="byline poppins-regular">By <b>${user.username}</b> &bull; ${post.date}</div>
            <div class="rule"></div>
            <p class="excerpt poppins-regular">${post.content}</p>
            <div class="article-actions">
                <span class="chip poppins-regular">Score: <b>${post.score}</b></span>
                <div class="vote">
                    <button type="button" class="v-btn" data-id="${post.id}" data-dir="1">▲</button>
                    <button type="button" class="v-btn" data-id="${post.id}" data-dir="-1">▼</button>
                </div>
                <button class="open-btn" type="button" data-id="${post.id}">Open</button>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });

    attachPostListeners();
}

// INTERACTION LISTENERS (Alerts Restored)
function attachPostListeners() {
    // Voting Listeners
    document.querySelectorAll('.v-btn').forEach(btn => {
        btn.onclick = () => {
            voteOnPost(btn.dataset.id, parseInt(btn.dataset.dir));
        };
    });

    // View Listeners
    document.querySelectorAll('.open-btn').forEach(btn => {
        btn.onclick = () => {
            const post = mockDatabase.posts.find(p => p.id === btn.dataset.id);
            if (post) {
                post.views = (Number(post.views) || 0) + 1;
                localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
                AlertModal.show("Opened post!", "success");
                renderPopularPosts();
            }
        };
    });
}

function voteOnPost(postId, direction) {
    if (!localStorage.getItem("currentUserId")) {
        AlertModal.show("Please login or sign up to interact.", "error");
        return;
    }

    const currentUserId = localStorage.getItem("currentUserId");
    const votesKey = "votes_" + currentUserId;
    const votes = JSON.parse(localStorage.getItem(votesKey) || '{}');
    const prev = votes[postId] || 0;
    const next = (prev === direction) ? 0 : direction;
    
    const post = mockDatabase.posts.find(p => p.id === postId);
    if (!post) return;

    // Reset previous vote impact
    if (prev === 1) post.upvotes = (Number(post.upvotes) || 0) - 1;
    if (prev === -1) post.downvotes = (Number(post.downvotes) || 0) - 1;
    
    // Apply new vote impact
    if (next !== 0) {
        if (next === 1) post.upvotes = (Number(post.upvotes) || 0) + 1;
        if (next === -1) post.downvotes = (Number(post.downvotes) || 0) + 1;
        
        // Update interaction timestamp for "Hot" sorting
        post.lastInteraction = Date.now(); 
        trackVoteReceivedToday(postId);
    }
    
    if (next === 0) delete votes[postId];
    else votes[postId] = next;
    
    localStorage.setItem(votesKey, JSON.stringify(votes));
    localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
    
    AlertModal.show("Vote updated!", "success");
    renderPopularPosts();
}

// CUSTOM DROPDOWN SYSTEM
function initCustomSelects() {
    const selects = document.querySelectorAll('.custom-select');

    selects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const options = select.querySelectorAll('.option');
        const triggerText = select.querySelector('.trigger-text');

        trigger.onclick = (e) => {
            e.stopPropagation();
            // Close other dropdowns
            selects.forEach(s => { if(s !== select) s.classList.remove('open'); });
            select.classList.toggle('open');
        };

        options.forEach(option => {
            option.onclick = () => {
                const val = option.dataset.value;
                triggerText.textContent = option.textContent;
                
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (select.id === 'sortSelect') {
                    sortMode = val;
                    // Toggle timeframe dropdown visibility
                    const timeSelect = document.getElementById('timeSelect');
                    if (val === 'top') {
                        timeSelect.style.display = 'block';
                    } else {
                        timeSelect.style.display = 'none';
                    }
                } else if (select.id === 'timeSelect') {
                    timeFrame = val;
                }
                
                renderPopularPosts();
                select.classList.remove('open');
            };
        });
    });

    // Close on outside click
    window.onclick = () => {
        selects.forEach(s => s.classList.remove('open'));
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initCustomSelects();
    renderPopularPosts();
});