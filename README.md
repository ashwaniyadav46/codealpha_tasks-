<<<<<<< HEAD
# CodeAlpha Full Stack Development Internship

This repository contains the completed full-stack web applications for the **CodeAlpha Full Stack Development Internship**:

1. **Task 1 — Simple E-commerce Store**
   - **Frontend**: HTML5, CSS3, Modern JavaScript (Fetch API, Modals, Responsive Grid)
   - **Backend**: Node.js & Express.js REST API
   - **Database**: MongoDB (Mongoose models for Users, Products, and Orders)
   - **Features**: Product catalog with auto-seeding, product details modal, dynamic shopping cart (add/quantity/remove/total), user registration & login, order checkout & order history tracking.

2. **Task 2 — Mini Social Media Platform**
   - **Frontend**: HTML5, CSS3, Modern JavaScript (Dynamic Feed, Multi-profile switcher)
   - **Backend**: Node.js & Express.js REST API
   - **Database**: MongoDB (Mongoose models for Users, Posts, Likes, Comments, Followers)
   - **Features**: User profiles creation & switching, status post composer, likes/unlikes with real-time counters, threaded comments, community member list with interactive follow/unfollow system.

The official internship task requirements document is provided in [`CodeAlpha_Tasks.pdf`](file:///c:/Users/ashwa/Downloads/CodeAlpha_fsd/CodeAlpha_Tasks.pdf).

---

## Prerequisites

Before running the projects, make sure you have:

1. **Node.js**: Installed (v18 or higher recommended). Verify with `node -v`.
2. **MongoDB**: Local MongoDB community service running on port `27017` OR MongoDB Atlas connection string.

---

## Quick Start (One-Click on Windows)

You can launch either or both projects using the included scripts:

- **Run Task 1 (E-commerce)**: Double-click `run-task1.bat` or run:
  ```powershell
  npm run start:task1
  ```
  App opens at: **http://localhost:5000**

- **Run Task 2 (Social Media)**: Double-click `run-task2.bat` or run:
  ```powershell
  npm run start:task2
  ```
  App opens at: **http://localhost:5001**

- **Run Both Simultaneously**: Double-click `run-all.bat`

---

## Manual Step-by-Step Instructions

### Task 1: Simple E-commerce Store

```bash
cd Task-1-Ecommerce
npm install
npm start
```

- Open your browser at: **`http://localhost:5000`**
- **Environment settings** (`Task-1-Ecommerce/.env`):
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/codealpha_ecommerce
  ```

#### What to test in Task 1:
1. **Product Catalog**: Sample products are automatically loaded on first startup.
2. **Product Details**: Click on any product card to open the detailed view with full description, category, and pricing.
3. **Cart Management**: Add items to cart, adjust quantities (+/-), or remove items.
4. **User Registration / Login**: Click **Login / Register** in the top navigation to create an account or sign in.
5. **Checkout**: Enter your name/email, click **Place Order Now**, and check the confirmation.
6. **Order History**: Click **📦 My Orders** to view past placed orders.

---

### Task 2: Mini Social Media Platform

```bash
cd Task-2-Social-Media
npm install
npm start
```

- Open your browser at: **`http://localhost:5001`**
- **Environment settings** (`Task-2-Social-Media/.env`):
  ```env
  PORT=5001
  MONGO_URI=mongodb://127.0.0.1:27017/codealpha_social
  ```

#### What to test in Task 2:
1. **User Profiles**: View profiles, switch active account with the **Browsing as** dropdown in the header, or create a new profile in the left sidebar.
2. **Post Updates**: Write a status update in the composer and click **Publish Post**.
3. **Likes**: Click the **Like** button on any post to toggle like/unlike.
4. **Comments**: Type a comment under any post and click **Reply**.
5. **Follow System**: In the right sidebar under **Community Members**, click **+ Follow** / **Following** to follow or unfollow other users.

---

## Project Structure

```text
CodeAlpha_fsd/
├── CodeAlpha_Tasks.pdf          # Official CodeAlpha assignment sheet
├── README.md                    # Setup and guide documentation
├── SUBMISSION_CHECKLIST.md      # Submission steps and checklist
├── package.json                 # Root script runner
├── run-all.bat                  # One-click launcher for both tasks
├── run-task1.bat                # One-click launcher for Task 1
├── run-task2.bat                # One-click launcher for Task 2
│
├── Task-1-Ecommerce/            # Task 1: Simple E-commerce Store
│   ├── .env                     # Server port and MongoDB connection URI
│   ├── package.json             # Task 1 dependencies (express, mongoose, dotenv)
│   ├── server.js                # Express REST API, Schemas (User, Product, Order)
│   └── public/
│       ├── index.html           # Store UI, modals for product details, auth & orders
│       ├── style.css            # Responsive layout and styling
│       └── app.js               # Frontend business logic & event handlers
│
└── Task-2-Social-Media/         # Task 2: Mini Social Media Platform
    ├── .env                     # Server port and MongoDB connection URI
    ├── package.json             # Task 2 dependencies (express, mongoose, dotenv)
    ├── server.js                # Express REST API, Schemas (User, Post)
    └── public/
        ├── index.html           # Social UI (Profiles, Feed, Follow members)
        ├── style.css            # Modern 3-column feed styling
        └── app.js               # Client logic (likes, follows, comments, posts)
```
=======
# codealpha_tasks-
>>>>>>> d5ce2760119d12d30fb8988e569a2040b52ffafa
