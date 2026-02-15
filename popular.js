let sortMode = 'hot';
let timeFrame = 'today';

function parsePostDate(dateStr) { return new Date(dateStr); }

// Logic to check timeframe for "Top" sorting
function isPostInTimeframe(post, timeframe) {
    const postDate = parsePostDate(post.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    postDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - postDate) / (1000 * 60 * 60 * 24));
    
    switch(timeframe) {
        case 'today': return daysDiff === 0;
        case 'week': return daysDiff >= 0 && daysDiff < 7;
        case 'month': return daysDiff >= 0 && daysDiff < 30;
        case 'year': return daysDiff >= 0 && daysDiff < 365;
        case 'alltime': return true;
        default: return true;
    }
}

function getSortedPosts() {
    let posts = mockDatabase.posts.map(post => ({
        ...post,
        score: (Number(post.upvotes) || 0) - (Number(post.downvotes) || 0),
        lastInteraction: post.lastInteraction || 0
    }));

    if (sortMode === 'hot') {
        // Sort by the most recent vote timestamp
        return posts.sort((a, b) => b.lastInteraction - a.lastInteraction);
    } else {
        // Filter by timeframe and sort by highest score
        posts = posts.filter(post => isPostInTimeframe(post, timeFrame));
        return posts.sort((a, b) => b.score - a.score);
    }
}

function renderPopularPosts() {
    const postsContainer = document.querySelector('.paper-grid');
    const popularDate = document.getElementById('popularDate');
    if (!postsContainer) return;

    if (popularDate) {
        popularDate.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });
    }

    postsContainer.innerHTML = '';
    const sortedPosts = getSortedPosts();
    
    sortedPosts.forEach((post, index) => {
        const user = mockDatabase.users.find(u => u.id === post.authorId) || {username: "Unknown"};
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
            </div>`;
        postsContainer.appendChild(postElement);
    });

    attachPostListeners();
}

function attachPostListeners() {
    // Vote Buttons
    document.querySelectorAll('.v-btn').forEach(btn => {
        btn.onclick = () => voteOnPost(btn.dataset.id, parseInt(btn.dataset.dir));
    });

    // Open Button (Views Alert)
    document.querySelectorAll('.open-btn').forEach(btn => {
        btn.onclick = () => {
            const post = mockDatabase.posts.find(p => p.id === btn.dataset.id);
            if (post) {
                post.views = (Number(post.views) || 0) + 1;
                localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
                AlertModal.show("Views updated!", "success");
                renderPopularPosts();
            }
        };
    });
}

function voteOnPost(postId, direction) {
    if (!localStorage.getItem("currentUserId")) {
        AlertModal.show("Please login to interact.", "error");
        return;
    }
    const currentUserId = localStorage.getItem("currentUserId");
    const votesKey = "votes_" + currentUserId;
    const votes = JSON.parse(localStorage.getItem(votesKey) || '{}');
    const prev = votes[postId] || 0;
    const next = (prev === direction) ? 0 : direction;
    const post = mockDatabase.posts.find(p => p.id === postId);

    if (!post) return;

    if (prev === 1) post.upvotes--;
    if (prev === -1) post.downvotes--;
    
    if (next !== 0) {
        if (next === 1) post.upvotes++;
        if (next === -1) post.downvotes++;
        // Set timestamp for 'Hot' sorting
        post.lastInteraction = Date.now(); 
    }
    
    if (next === 0) delete votes[postId]; else votes[postId] = next;
    
    localStorage.setItem(votesKey, JSON.stringify(votes));
    localStorage.setItem('mockDatabase', JSON.stringify(mockDatabase));
    
    AlertModal.show("Vote updated!", "success");
    renderPopularPosts();
}

// Custom Select initialization logic
function initCustomSelects() {
    const selects = document.querySelectorAll('.custom-select');
    selects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const options = select.querySelectorAll('.option');
        
        trigger.onclick = (e) => {
            e.stopPropagation();
            selects.forEach(s => { if(s !== select) s.classList.remove('open'); });
            select.classList.toggle('open');
        };

        options.forEach(option => {
            option.onclick = () => {
                const val = option.dataset.value;
                select.querySelector('.trigger-text').textContent = option.textContent;
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                if (select.id === 'sortSelect') {
                    sortMode = val;
                    document.getElementById('timeSelect').style.display = (val === 'top') ? 'block' : 'none';
                } else {
                    timeFrame = val;
                }
                renderPopularPosts();
            };
        });
    });
    window.onclick = () => selects.forEach(s => s.classList.remove('open'));
}

document.addEventListener('DOMContentLoaded', () => {
    initCustomSelects();
    renderPopularPosts();
});