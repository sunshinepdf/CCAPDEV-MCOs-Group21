/**
 * ### `scripts/seed.js`
 * - Seeds MongoDB with initial users and posts.
 * - Creates users with hashed passwords and maps legacy IDs to Mongo `_id` values.
 * - Seeds posts with comments and default interaction metrics (votes/views).
*/

// Import necessary modules
import bcrypt from "bcryptjs";
import env from "../src/config/env.js";
import { connectDatabase } from "../src/config/conn.js";
import User from "../src/model/User.js";
import Post from "../src/model/Post.js";

function parseSeedDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

// Define seed data for users and posts with legacy IDs for mapping
const seedUsers = [
  {
    legacyId: "u1",
    username: "CCAPDEV-G21",
    email: "ccapdev.group21@dlsu.edu.ph",
    password: "ccapdevgroup21",
    photo: "assets/profile-icon-default.png",
    year: "2nd Year",
    pronouns: "they/them",
    major: "BS - Computer Science",
    bio: "Hello! We are the developers of Animo Commons!",
    tags: ["Site Devs", "CCS", "ID 124"]
  },
  {
    legacyId: "u2",
    username: "user167",
    email: "user167@dlsu.edu.ph",
    password: "password123",
    photo: "assets/profile-icon-default.png",
    year: "1st Year",
    pronouns: "he/him",
    major: "BS - Biology"
  },
  {
    legacyId: "u3",
    username: "JaneDoe",
    email: "jane.doe@dlsu.edu.ph",
    password: "securepass",
    photo: "assets/profile-icon-default.png",
    year: "3rd Year",
    pronouns: "she/her",
    major: "BS - IT"
  },
  {
    legacyId: "u4",
    username: "ccsstudent",
    email: "psychology.student@dlsu.edu.ph",
    password: "password",
    photo: "assets/profile-icon-default.png",
    year: "4th Year",
    pronouns: "he/him",
    major: "BS - Psychology"
  },
  {
    legacyId: "u5",
    username: "JohnSmith",
    email: "john.smith@dlsu.edu.ph",
    password: "johnspassword",
    photo: "assets/profile-icon-default.png",
    year: "2nd Year",
    pronouns: "he/him",
    major: "BSMS - CS"
  }
];

// Define seed data for posts with legacy IDs for mapping and default interaction metrics
const seedPosts = [
  {
    legacyId: "p1",
    authorLegacyId: "u1",
    category: "discussion",
    date: "Feb 11, 2026",
    title: "Amazing sunset at the campus",
    content:
      "Just witnessed the most beautiful sunset from the rooftop. The sky was painted in hues of orange and pink. Nature is truly amazing!",
    upvotes: 41,
    downvotes: 2,
    views: 801,
    comments: [
      {
        userLegacyId: "u2",
        text: "That sounds incredible! I'll try to catch it next time.",
        createdAt: "Feb 11, 2026"
      },
      { userLegacyId: "u3", text: "Do you have a photo? Would love to see it!", createdAt: "Feb 11, 2026" }
    ]
  },
  {
    legacyId: "p2",
    authorLegacyId: "u2",
    category: "discussion",
    date: "Feb 11, 2026",
    title: "New coffee shop in town",
    content:
      "Found this hidden gem of a coffee shop. Their latte art is incredible and the ambiance is perfect for studying.",
    upvotes: 38,
    downvotes: 0,
    views: 799,
    comments: [
      {
        userLegacyId: "u4",
        text: "What's the name and location? I need a new study spot!",
        createdAt: "Feb 11, 2026"
      }
    ]
  },
  {
    legacyId: "p3",
    authorLegacyId: "u3",
    category: "help",
    date: "Feb 11, 2026",
    title: "Group study session tips",
    content:
      "Anyone have tips for effective group study sessions? We're struggling to stay focused and productive.",
    upvotes: 32,
    downvotes: 1,
    views: 609,
    comments: [
      {
        userLegacyId: "u1",
        text: "Set clear goals before starting and take regular breaks. Also designate one person as timekeeper!",
        createdAt: "Feb 11, 2026"
      },
      {
        userLegacyId: "u5",
        text: "Try the 25-5 method: 25 mins focus, 5 mins break. Works well for my group!",
        createdAt: "Feb 11, 2026"
      }
    ]
  },
  {
    legacyId: "p4",
    authorLegacyId: "u4",
    category: "discussion",
    date: "Feb 11, 2026",
    title: "Best budget meals around campus under ₱120?",
    content:
      "Drop your go-to meals. Preferably something filling and not too oily because I have class after.",
    upvotes: 10,
    downvotes: 3,
    views: 105,
    comments: [
      {
        userLegacyId: "u2",
        text: "Tapsilog from the cafeteria is only ₱95 and pretty filling!",
        createdAt: "Feb 11, 2026"
      }
    ]
  },
  {
    legacyId: "p5",
    authorLegacyId: "u5",
    category: "discussion",
    date: "Feb 12, 2026",
    title: "M&Ms",
    content:
      "Whenever I get a package of plain M&Ms, I make it my duty to continue the strength and robustness of the candy as a species...",
    upvotes: 29,
    downvotes: 4,
    views: 516,
    comments: []
  },
  {
    legacyId: "p6",
    authorLegacyId: "u1",
    category: "news",
    date: "Feb 07, 2026",
    title: "Lost: black umbrella (with sticker)",
    content:
      "Lost my black umbrella with a tiny 'Animo' sticker. Last seen near Henry 6th floor.",
    upvotes: 7,
    downvotes: 0,
    views: 210,
    comments: []
  },
  {
    legacyId: "p7",
    authorLegacyId: "u2",
    category: "help",
    date: "Feb 09, 2026",
    title: "Where can I print for cheap near campus?",
    content:
      "Need to print 40 pages by tomorrow. Any shop reco that doesn't overcharge?",
    upvotes: 9,
    downvotes: 0,
    views: 345,
    comments: [
      {
        userLegacyId: "u3",
        text: "Try the print shop on Taft near McDonald's. They charge ₱2 per page for B&W.",
        createdAt: "Feb 09, 2026"
      },
      {
        userLegacyId: "u1",
        text: "Library printing is ₱2.50 but they're open until 10pm if you're in a rush.",
        createdAt: "Feb 09, 2026"
      }
    ]
  },
  {
    legacyId: "p8",
    authorLegacyId: "u3",
    category: "discussion",
    date: "Feb 08, 2026",
    title: "Coffee spots: strong caffeine, not too sweet",
    content:
      "I like coffee that tastes like coffee. Any places near campus that do it right?",
    upvotes: 16,
    downvotes: 2,
    views: 521,
    comments: [
      {
        userLegacyId: "u5",
        text: "Bo's Coffee does a great americano. Strong and no sugar.",
        createdAt: "Feb 08, 2026"
      }
    ]
  },
  {
    legacyId: "p9",
    authorLegacyId: "u4",
    category: "help",
    date: "Feb 08, 2026",
    title: "CSS Grid: why isn't my layout responsive?",
    content:
      "My cards overflow on mobile. I used repeat(3,1fr). What's the clean fix?",
    upvotes: 13,
    downvotes: 0,
    views: 289,
    comments: [
      {
        userLegacyId: "u1",
        text: "Use repeat(auto-fit, minmax(250px, 1fr)) instead. It'll automatically adjust columns based on screen size.",
        createdAt: "Feb 08, 2026"
      },
      {
        userLegacyId: "u2",
        text: "Also add gap: 1rem; for better spacing between cards!",
        createdAt: "Feb 08, 2026"
      }
    ]
  },
  {
    legacyId: "p10",
    authorLegacyId: "u5",
    category: "news",
    date: "Feb 03, 2026",
    title: "Org recruitment: what to expect",
    content:
      "Most orgs ask for a short interview + one mini task. Don't overthink it — just be genuine.",
    upvotes: 17,
    downvotes: 1,
    views: 512,
    comments: []
  },
  {
    legacyId: "p11",
    authorLegacyId: "u1",
    category: "discussion",
    date: "Feb 06, 2026",
    title: "Study routine check: what actually works for you?",
    content: "Pomodoro? 3-hour lock in? Share your routine.",
    upvotes: 28,
    downvotes: 3,
    views: 745,
    comments: [
      {
        userLegacyId: "u4",
        text: "I do 50-10 cycles. 50 mins study, 10 mins complete break (no phone). Helps me stay focused longer.",
        createdAt: "Feb 06, 2026"
      },
      {
        userLegacyId: "u3",
        text: "Pomodoro (25-5) works best for me. The shorter bursts keep my brain fresh.",
        createdAt: "Feb 06, 2026"
      }
    ]
  },
  {
    legacyId: "p12",
    authorLegacyId: "u2",
    category: "help",
    date: "Feb 05, 2026",
    title: "Anyone has notes for last week's lecture?",
    content:
      "I got sick and missed one class. If you have notes, I'll trade mine from the previous week.",
    upvotes: 14,
    downvotes: 0,
    views: 305,
    comments: []
  },
  {
    legacyId: "p13",
    authorLegacyId: "u3",
    category: "discussion",
    date: "Feb 04, 2026",
    title: "Are term breaks actually restful?",
    content:
      "I always say I'll rest then I end up catching up on everything. Same?",
    upvotes: 21,
    downvotes: 2,
    views: 640,
    comments: [
      {
        userLegacyId: "u5",
        text: "Same here! I think the trick is to schedule rest days like you schedule work.",
        createdAt: "Feb 04, 2026"
      }
    ]
  },
  {
    legacyId: "p14",
    authorLegacyId: "u4",
    category: "help",
    date: "Feb 04, 2026",
    title: "Quick: APA citation basics",
    content:
      "Do I need page numbers for paraphrasing? Confused between quote vs paraphrase rules.",
    upvotes: 8,
    downvotes: 0,
    views: 280,
    comments: []
  },
  {
    legacyId: "p15",
    authorLegacyId: "u5",
    category: "news",
    date: "Feb 05, 2026",
    title: "Free seminar seats still open (last call)",
    content:
      "Need extra certificates? There are still open seats. Registration closes tonight.",
    upvotes: 10,
    downvotes: 0,
    views: 388,
    comments: []
  },
  {
    legacyId: "p16",
    authorLegacyId: "u1",
    category: "discussion",
    date: "Feb 02, 2026",
    title: "Best study spots on campus?",
    content: "Where do you study when you need deep focus?",
    upvotes: 20,
    downvotes: 2,
    views: 610,
    comments: [
      {
        userLegacyId: "u2",
        text: "4th floor of the library is usually quiet. Perfect for focused work.",
        createdAt: "Feb 02, 2026"
      },
      {
        userLegacyId: "u4",
        text: "Henry study lounges if you can find an empty one. Very peaceful.",
        createdAt: "Feb 02, 2026"
      }
    ]
  },
  {
    legacyId: "p17",
    authorLegacyId: "u2",
    category: "help",
    date: "Feb 01, 2026",
    title: "How to join orgs mid-term?",
    content: "Missed the org fair. Can I still join or wait next term?",
    upvotes: 12,
    downvotes: 1,
    views: 411,
    comments: []
  },
  {
    legacyId: "p18",
    authorLegacyId: "u3",
    category: "discussion",
    date: "Jan 30, 2026",
    title: "Underrated snacks for late-night study",
    content:
      "Need snack recos that won't make me crash in 30 mins.",
    upvotes: 15,
    downvotes: 2,
    views: 477,
    comments: [
      {
        userLegacyId: "u1",
        text: "Trail mix or nuts. The protein keeps you going without the sugar crash.",
        createdAt: "Jan 30, 2026"
      }
    ]
  },
  {
    legacyId: "p19",
    authorLegacyId: "u4",
    category: "news",
    date: "Jan 29, 2026",
    title: "Lost: earphones around library",
    content:
      "Lost my earphones around the library yesterday. If you found it please message me.",
    upvotes: 9,
    downvotes: 0,
    views: 300,
    comments: []
  },
  {
    legacyId: "p20",
    authorLegacyId: "u5",
    category: "discussion",
    date: "Jan 28, 2026",
    title: "What app feature would you actually use daily?",
    content:
      "If Animo Commons existed for real, what feature would make you daily?",
    upvotes: 17,
    downvotes: 3,
    views: 520,
    comments: [
      {
        userLegacyId: "u3",
        text: "Marketplace for secondhand books and notes would be super useful.",
        createdAt: "Jan 28, 2026"
      },
      {
        userLegacyId: "u2",
        text: "Event calendar for all org activities so I don't miss anything!",
        createdAt: "Jan 28, 2026"
      }
    ]
  }
];

// Helper function to enrich user data with post count and reputation stats
async function run() {
  await connectDatabase(env.mongoUri);

  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);

  const users = [];
  for (const item of seedUsers) {
    const passwordHash = await bcrypt.hash(item.password, 10);
    const user = await User.create({ ...item, passwordHash });
    users.push(user);
  }

  const usersByLegacyId = users.reduce((acc, user) => {
    acc[user.legacyId] = user;
    return acc;
  }, {});

  for (const postItem of seedPosts) {
    const author = users.find((user) => user.legacyId === postItem.authorLegacyId);
    if (!author) continue;

    const postDate = parseSeedDate(postItem.date);

    const mappedComments = (postItem.comments || [])
      .map((comment) => {
        const commentUser = usersByLegacyId[comment.userLegacyId];
        if (!commentUser) return null;

        const commentDate = parseSeedDate(comment.createdAt || postItem.date);

        return {
          userId: commentUser._id,
          text: comment.text,
          parentId: null,
          editedAt: null,
          votes: {},
          createdAt: commentDate,
          updatedAt: commentDate
        };
      })
      .filter(Boolean);

    const createdPost = await Post.create({
      legacyId: postItem.legacyId,
      authorId: author._id,
      category: postItem.category,
      title: postItem.title,
      content: postItem.content,
      upvotes: postItem.upvotes,
      downvotes: postItem.downvotes,
      views: postItem.views,
      lastUpvotedAt: postItem.upvotes > 0 ? postDate : null,
      comments: mappedComments,
      lastInteraction: postDate
    });

    await Post.updateOne(
      { _id: createdPost._id },
      {
        $set: {
          createdAt: postDate,
          updatedAt: postDate,
          comments: mappedComments
        }
      },
      { timestamps: false }
    );
  }

  console.log("Seed complete");
  process.exit(0);
}

// Execute the seed function and handle any errors that occur during the seeding process
run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});

