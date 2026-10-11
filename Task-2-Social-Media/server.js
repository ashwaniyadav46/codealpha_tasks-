require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codealpha_social";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  bio: { type: String, default: "CodeAlpha Full Stack Intern" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

// Initial seed data
const demoSeedData = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return false;

  console.log("Seeding sample community data for Task 2...");
  const alex = await User.create({
    name: "Alex Johnson",
    bio: "Full stack developer passionate about JavaScript, React, and cloud architectures."
  });
  const priya = await User.create({
    name: "Priya Sharma",
    bio: "UI/UX enthusiast & web explorer. Building beautiful, responsive web applications."
  });
  const devon = await User.create({
    name: "Devon Miller",
    bio: "Backend developer & open source enthusiast. Python & Node.js lover."
  });

  // Cross follow
  alex.followers.push(priya._id, devon._id);
  priya.followers.push(alex._id);
  devon.followers.push(alex._id, priya._id);
  await Promise.all([alex.save(), priya.save(), devon.save()]);

  // Seed sample posts
  await Post.create([
    {
      author: alex._id,
      text: "Excited to begin the CodeAlpha Full Stack Development internship! Working on modern web applications with Node.js and MongoDB 🚀",
      likes: [priya._id, devon._id],
      comments: [
        { user: "Priya Sharma", text: "Welcome Alex! Let's build some amazing projects together!" },
        { user: "Devon Miller", text: "Awesome! Full stack with Express & MongoDB is super fun." }
      ]
    },
    {
      author: priya._id,
      text: "Tip of the day: Always keep your frontend UI responsive and accessible. Good CSS goes a long way! 💻✨",
      likes: [alex._id],
      comments: [
        { user: "Alex Johnson", text: "100% agreed! Clean UI makes a huge difference." }
      ]
    },
    {
      author: devon._id,
      text: "Just completed the REST API endpoints for user profiles, likes, and follower graph. Testing with Postman! ⚙️",
      likes: [alex._id, priya._id],
      comments: []
    }
  ]);

  return true;
};

// --- User Routes ---
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Could not load users" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Profile name is required." });
    }

    const existing = await User.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "A profile with this username already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      bio: bio ? bio.trim() : "CodeAlpha learner"
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: "Could not create user profile." });
  }
});

// Follow / Unfollow toggle
app.post("/api/users/:id/follow", async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const { followerId } = req.body;

    if (!target) return res.status(404).json({ message: "User not found" });
    if (!followerId) return res.status(400).json({ message: "Follower ID is required" });
    if (target._id.toString() === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const index = target.followers.findIndex(id => id.toString() === followerId);
    let isFollowing = false;

    if (index >= 0) {
      // Unfollow
      target.followers.splice(index, 1);
      isFollowing = false;
    } else {
      // Follow
      target.followers.push(followerId);
      isFollowing = true;
    }

    await target.save();
    res.json({
      followersCount: target.followers.length,
      isFollowing,
      message: isFollowing ? `You are now following ${target.name}` : `Unfollowed ${target.name}`
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating follow status" });
  }
});

// --- Post Routes ---
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name bio")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Could not load posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const { authorId, text } = req.body;
    if (!authorId || !text || !text.trim()) {
      return res.status(400).json({ message: "Valid author and post text are required." });
    }

    const author = await User.findById(authorId);
    if (!author) return res.status(404).json({ message: "Selected author does not exist." });

    const post = await Post.create({
      author: authorId,
      text: text.trim()
    });

    const populatedPost = await Post.findById(post._id).populate("author", "name bio");
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ message: "Could not publish post." });
  }
});

// Toggle Like / Unlike
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { userId } = req.body;

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!userId) return res.status(400).json({ message: "User ID is required to like" });

    const index = post.likes.findIndex(id => id.toString() === userId);
    let liked = false;

    if (index >= 0) {
      post.likes.splice(index, 1);
      liked = false;
    } else {
      post.likes.push(userId);
      liked = true;
    }

    await post.save();
    res.json({ likesCount: post.likes.length, liked });
  } catch (err) {
    res.status(500).json({ message: "Error toggling like" });
  }
});

// Add Comment
app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { user, text } = req.body;

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!user || !text || !text.trim()) {
      return res.status(400).json({ message: "User name and comment text are required." });
    }

    post.comments.push({
      user: user.trim(),
      text: text.trim(),
      createdAt: new Date()
    });

    await post.save();
    res.status(201).json({
      message: "Comment added",
      comments: post.comments
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

// Seed API endpoint
app.post("/api/seed", async (req, res) => {
  try {
    const seeded = await demoSeedData();
    res.json({ message: seeded ? "Demo data seeded successfully!" : "Data already exists" });
  } catch (err) {
    res.status(500).json({ message: "Error seeding data: " + err.message });
  }
});

// --- Server Startup ---
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully:", MONGO_URI);
    await demoSeedData();
    app.listen(PORT, () => console.log(`Social Media platform running at: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
