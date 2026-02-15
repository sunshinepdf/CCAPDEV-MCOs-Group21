// Sets the current user ID based on localStorage, defaulting to "u1" if not set
var CURRENT_USER_ID = localStorage.getItem("currentUserId") || "u1";

// Fetches the mock database from localStorage
// NOTE: Comment this out to use default data from this file instead of cached localStorage data
const savedData = JSON.parse(localStorage.getItem('mockDatabase'));

const defaultDatabase = {
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
            bio: "Hello! We are the developers of Animo Commons!",
            tags:["Site Devs", "CCS", "ID 124"],
            stats: { posts: 3, reputation: 50 }
        },
        { 
          id: "u2", 
          username: "user167", 
          email: "user167@dlsu.edu.ph", 
          password: "password123", 
          photo: "assets/placeholder.png", 
          year: "1st Year", pronouns: "he/him", 
          major: "BS - Biology", 
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
          major: "BS - IT", 
          stats: { posts: 5, reputation: 78 } 
        },
        { 
          id: "u4", 
          username: "ccsstudent", 
          email: "psychology.student@dlsu.edu.ph", 
          password: "password", 
          photo: "assets/placeholder.png", 
          year: "4th Year", 
          pronouns: "he/him", 
          major: "BS - Psychology", 
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
          major: "BSMS - CS", 
          stats: { posts: 4, reputation: 60 } 
        }
    ],

    posts: [
        { id:"p1",  authorId:"u1", category:"discussion", title:"Amazing sunset at the campus", content:"Just witnessed the most beautiful sunset from the rooftop. The sky was painted in hues of orange and pink. Nature is truly amazing!", date:"Feb 11, 2026", upvotes:41, downvotes:2, views:801, lastInteraction: Date.now(), comments: [] },
        { id:"p2",  authorId:"u2", category:"discussion", title:"New coffee shop in town", content:"Found this hidden gem of a coffee shop. Their latte art is incredible and the ambiance is perfect for studying.", date:"Feb 11, 2026", upvotes:38, downvotes:0, views:799, lastInteraction: Date.now(), comments: [] },
        { id:"p3",  authorId:"u3", category:"help", title:"Group study session tips", content:"Anyone have tips for effective group study sessions? We're struggling to stay focused and productive.", date:"Feb 11, 2026", upvotes:32, downvotes:1, views:609, lastInteraction: Date.now(), comments: [] },
        { id:"p4",  authorId:"u4", category:"discussion", title:"Best budget meals around campus under ₱120?", content:"Drop your go-to meals. Preferably something filling and not too oily because I have class after.", date:"Feb 11, 2026", upvotes:10, downvotes:3, views:105, lastInteraction: Date.now(), comments: [] },
        { id:"p5",  authorId:"u5", category:"discussion", title:"M&Ms", content:"Whenever I get a package of plain M&Ms, I make it my duty to continue the strength and robustness of the candy as a species...", date:"Feb 12, 2026", upvotes:29, downvotes:4, views:516, lastInteraction: Date.now(), comments: [] },
        { id:"p6",  authorId:"u1", category:"news", title:"Lost: black umbrella (with sticker)", content:"Lost my black umbrella with a tiny 'Animo' sticker. Last seen near Henry 6th floor.", date:"Feb 07, 2026", upvotes:7,  downvotes:0, views:210, lastInteraction: Date.now(), comments: [] },
        { id:"p7",  authorId:"u2", category:"help", title:"Where can I print for cheap near campus?", content:"Need to print 40 pages by tomorrow. Any shop reco that doesn't overcharge?", date:"Feb 09, 2026", upvotes:9,  downvotes:0, views:345, lastInteraction: Date.now(), comments: [] },
        { id:"p8",  authorId:"u3", category:"discussion", title:"Coffee spots: strong caffeine, not too sweet", content:"I like coffee that tastes like coffee. Any places near campus that do it right?", date:"Feb 08, 2026", upvotes:16, downvotes:2, views:521, lastInteraction: Date.now(), comments: [] },
        { id:"p9",  authorId:"u4", category:"help", title:"CSS Grid: why isn't my layout responsive?", content:"My cards overflow on mobile. I used repeat(3,1fr). What's the clean fix?", date:"Feb 08, 2026", upvotes:13, downvotes:0, views:289, lastInteraction: Date.now(), comments: [] },
        { id:"p10", authorId:"u5", category:"news", title:"Org recruitment: what to expect", content:"Most orgs ask for a short interview + one mini task. Don't overthink it — just be genuine.", date:"Feb 03, 2026", upvotes:17, downvotes:1, views:512, lastInteraction: Date.now(), comments: [] },
        { id:"p11", authorId:"u1", category:"discussion", title:"Study routine check: what actually works for you?", content:"Pomodoro? 3-hour lock in? Share your routine.", date:"Feb 06, 2026", upvotes:28, downvotes:3, views:745, lastInteraction: Date.now(), comments: [] },
        { id:"p12", authorId:"u2", category:"help", title:"Anyone has notes for last week's lecture?", content:"I got sick and missed one class. If you have notes, I'll trade mine from the previous week.", date:"Feb 05, 2026", upvotes:14, downvotes:0, views:305, lastInteraction: Date.now(), comments: [] },
        { id:"p13", authorId:"u3", category:"discussion", title:"Are term breaks actually restful?", content:"I always say I'll rest then I end up catching up on everything. Same?", date:"Feb 04, 2026", upvotes:21, downvotes:2, views:640, lastInteraction: Date.now(), comments: [] },
        { id:"p14", authorId:"u4", category:"help", title:"Quick: APA citation basics", content:"Do I need page numbers for paraphrasing? Confused between quote vs paraphrase rules.", date:"Feb 04, 2026", upvotes:8,  downvotes:0, views:280, lastInteraction: Date.now(), comments: [] },
        { id:"p15", authorId:"u5", category:"news", title:"Free seminar seats still open (last call)", content:"Need extra certificates? There are still open seats. Registration closes tonight.", date:"Feb 05, 2026", upvotes:10, downvotes:0, views:388, lastInteraction: Date.now(), comments: [] },
        { id:"p16", authorId:"u1", category:"discussion", title:"Best study spots on campus?", content:"Where do you study when you need deep focus?", date:"Feb 02, 2026", upvotes:20, downvotes:2, views:610, lastInteraction: Date.now(), comments: [] },
        { id:"p17", authorId:"u2", category:"help", title:"How to join orgs mid-term?", content:"Missed the org fair. Can I still join or wait next term?", date:"Feb 01, 2026", upvotes:12, downvotes:1, views:411, lastInteraction: Date.now(), comments: [] },
        { id:"p18", authorId:"u3", category:"discussion", title:"Underrated snacks for late-night study", content:"Need snack recos that won't make me crash in 30 mins.", date:"Jan 30, 2026", upvotes:15, downvotes:2, views:477, lastInteraction: Date.now(), comments: [] },
        { id:"p19", authorId:"u4", category:"news", title:"Lost: earphones around library", content:"Lost my earphones around the library yesterday. If you found it please message me.", date:"Jan 29, 2026", upvotes:9,  downvotes:0, views:300, lastInteraction: Date.now(), comments: [] },
        { id:"p20", authorId:"u5", category:"discussion", title:"What app feature would you actually use daily?", content:"If Animo Commons existed for real, what feature would make you daily?", date:"Jan 28, 2026", upvotes:17, downvotes:3, views:520, lastInteraction: Date.now(), comments: [] }
    ]
};

// Merge logic to ensure views and votes are preserved on refresh
function mergeWithDefaults(saved, defaults) {
    if (!saved) return defaults;
    return {
        users: saved.users || defaults.users,
        posts: saved.posts || defaults.posts
    };
}


window.mockDatabase = JSON.parse(JSON.stringify(defaultDatabase));


function saveToLocalDB() {
    localStorage.setItem('mockDatabase', JSON.stringify(window.mockDatabase));
}

function logout() {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("rememberMeToken");
    window.location.href = "login.html";
}