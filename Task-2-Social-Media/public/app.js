// State
let users = [];
let posts = [];
let activeUser = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

// Load all users and posts
async function loadData() {
  try {
    const [usersRes, postsRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/posts")
    ]);

    users = await usersRes.json();
    posts = await postsRes.json();

    syncActiveUser();
    renderUserSwitcher();
    renderActiveProfileCard();
    renderFeed();
    renderMembersList();
  } catch (err) {
    console.error("Error loading social media data:", err);
  }
}

// Ensure an active user is chosen
function syncActiveUser() {
  const savedUserId = localStorage.getItem("codealpha_social_active");
  if (savedUserId) {
    activeUser = users.find(u => u._id === savedUserId);
  }
  if (!activeUser && users.length > 0) {
    activeUser = users[0];
    localStorage.setItem("codealpha_social_active", activeUser._id);
  }
}

function changeActiveUser(userId) {
  activeUser = users.find(u => u._id === userId) || users[0];
  if (activeUser) {
    localStorage.setItem("codealpha_social_active", activeUser._id);
  }
  renderUserSwitcher();
  renderActiveProfileCard();
  renderFeed();
  renderMembersList();
}

// Render the user switcher in navbar
function renderUserSwitcher() {
  const select = document.getElementById("activeUserSelect");
  if (!users.length) {
    select.innerHTML = `<option value="">No profiles yet</option>`;
    return;
  }

  select.innerHTML = users.map(u => `
    <option value="${u._id}" ${activeUser && activeUser._id === u._id ? "selected" : ""}>
      ${escapeHtml(u.name)}
    </option>
  `).join("");

  document.getElementById("postingAsLabel").textContent = activeUser ? activeUser.name : "Select profile";
}

// Render the Left Sidebar Active Profile Card
function renderActiveProfileCard() {
  if (!activeUser) {
    document.getElementById("activeName").textContent = "No profile active";
    document.getElementById("activeBio").textContent = "Create or select a profile to get started.";
    document.getElementById("activeAvatar").textContent = "?";
    document.getElementById("activeFollowersCount").textContent = "0";
    return;
  }

  document.getElementById("activeName").textContent = activeUser.name;
  document.getElementById("activeBio").textContent = activeUser.bio || "CodeAlpha learner";
  document.getElementById("activeAvatar").textContent = activeUser.name.charAt(0).toUpperCase();
  document.getElementById("activeFollowersCount").textContent = (activeUser.followers || []).length;
}

// Render Community Feed
function renderFeed() {
  const feedEl = document.getElementById("feed");

  if (!posts.length) {
    feedEl.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <p>No posts available yet. Be the first to share an update!</p>
      </div>`;
    return;
  }

  feedEl.innerHTML = posts.map(post => {
    const authorName = post.author?.name || "Anonymous";
    const authorBio = post.author?.bio || "";
    const likes = post.likes || [];
    const isLiked = activeUser && likes.some(id => id.toString() === activeUser._id);
    const comments = post.comments || [];
    const createdDate = new Date(post.createdAt || Date.now()).toLocaleDateString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    return `
      <article class="post-card">
        <div class="post-header">
          <div class="avatar-small">${authorName.charAt(0).toUpperCase()}</div>
          <div class="post-author-info">
            <div class="post-author-name">${escapeHtml(authorName)}</div>
            <div class="post-author-bio">${escapeHtml(authorBio)}</div>
          </div>
          <div class="post-date">${createdDate}</div>
        </div>

        <div class="post-content">${escapeHtml(post.text)}</div>

        <div class="post-actions-bar">
          <button class="btn-like ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}')">
            ${isLiked ? '❤️ Liked' : '🤍 Like'} (${likes.length})
          </button>
          <span style="font-size: 0.85rem; color: #64748b;">💬 ${comments.length} comments</span>
        </div>

        <div class="comments-section">
          <div class="comments-list">
            ${comments.map(c => `
              <div class="comment-bubble">
                <b>${escapeHtml(c.user)}:</b>
                <span>${escapeHtml(c.text)}</span>
              </div>
            `).join("")}
          </div>

          <form class="comment-input-row" onsubmit="handleComment(event, '${post._id}')">
            <input type="text" id="comment-input-${post._id}" placeholder="Write a comment..." required>
            <button type="submit" class="btn btn-primary btn-sm">Reply</button>
          </form>
        </div>
      </article>
    `;
  }).join("");
}

// Render Right Sidebar Members List with Follow Buttons
function renderMembersList() {
  const membersEl = document.getElementById("membersList");

  if (!users.length) {
    membersEl.innerHTML = `<p class="subtitle">No members yet.</p>`;
    return;
  }

  membersEl.innerHTML = users.map(user => {
    const isSelf = activeUser && user._id === activeUser._id;
    const followers = user.followers || [];
    const isFollowing = activeUser && followers.some(id => id.toString() === activeUser._id);

    return `
      <div class="member-item">
        <div class="member-info">
          <div class="avatar-small" style="width: 32px; height: 32px; font-size: 0.9rem;">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div class="member-details">
            <span class="member-name">${escapeHtml(user.name)} ${isSelf ? '<small style="color:#6366f1;">(You)</small>' : ''}</span>
            <span class="member-followers">${followers.length} followers</span>
          </div>
        </div>
        ${!isSelf ? `
          <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${user._id}')">
            ${isFollowing ? 'Following' : '+ Follow'}
          </button>
        ` : ''}
      </div>
    `;
  }).join("");
}

// Toggle Like
async function toggleLike(postId) {
  if (!activeUser) {
    alert("Please select or create a profile first.");
    return;
  }

  try {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUser._id })
    });
    if (res.ok) {
      loadData();
    }
  } catch (err) {
    console.error("Like error:", err);
  }
}

// Toggle Follow
async function toggleFollow(targetUserId) {
  if (!activeUser) {
    alert("Please select or create a profile first.");
    return;
  }

  try {
    const res = await fetch(`/api/users/${targetUserId}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: activeUser._id })
    });

    const data = await res.json();
    if (res.ok) {
      loadData();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Follow error:", err);
  }
}

// Add Comment
async function handleComment(e, postId) {
  e.preventDefault();
  if (!activeUser) {
    alert("Please select or create a profile first.");
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: activeUser.name,
        text
      })
    });

    if (res.ok) {
      input.value = "";
      loadData();
    }
  } catch (err) {
    console.error("Comment error:", err);
  }
}

// Create New Profile
async function handleCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById("newUserName").value.trim();
  const bio = document.getElementById("newUserBio").value.trim();
  const msgEl = document.getElementById("userMsg");

  if (!name) return;

  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio })
    });

    const data = await res.json();
    if (res.ok) {
      msgEl.textContent = `Profile "${data.name}" created!`;
      msgEl.style.color = "green";
      document.getElementById("createUserForm").reset();
      activeUser = data;
      localStorage.setItem("codealpha_social_active", data._id);
      loadData();
    } else {
      msgEl.textContent = data.message || "Failed to create profile.";
      msgEl.style.color = "red";
    }
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
    msgEl.style.color = "red";
  }
}

// Create New Post
async function handleCreatePost(e) {
  e.preventDefault();
  if (!activeUser) {
    alert("Please select or create a profile first.");
    return;
  }

  const textInput = document.getElementById("postText");
  const text = textInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: activeUser._id,
        text
      })
    });

    if (res.ok) {
      textInput.value = "";
      loadData();
    } else {
      const data = await res.json();
      alert(data.message || "Could not publish post.");
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// Seed / Reset demo data
async function seedSampleData() {
  if (confirm("Reset and seed sample community profiles and posts?")) {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      alert(data.message);
      loadData();
    } catch (err) {
      alert("Error seeding data: " + err.message);
    }
  }
}

function escapeHtml(value) {
  if (!value) return "";
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
