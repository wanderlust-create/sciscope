# 🔬 SciScope

**SciScope** is a backend API for browsing, searching, and saving science news. It integrates with an external news API and provides user bookmarking, custom bookmark groups, and analytics on top-bookmarked articles and most active users.

---

## ✨ Features

- 🔎 Search science articles by keyword
- 🧠 Fetch trending/general science news
- 🔖 Bookmark articles for later
- 🗂 Organize bookmarks into custom groups
- 📊 Analytics: Most bookmarked articles & top users
- 🧪 Real API integration with caching & tests
- ✅ Full CRUD for bookmarks and groups
- 🔐 Auth with login/signup and protected routes

---

## 📦 Tech Stack

- **Node.js**, **Express**
- **PostgreSQL**, **Knex.js**, **Objection.js**
- **Axios** for external API requests
- **Node-cache** for in-memory caching
- **Jest** and **Supertest** for testing
- **Dotenv**, **ES Modules**, **Logger (console)**

---

## 📁 Folder Structure

```
SciScope/
│── src/
│   ├── config/             # Knex config, env loader
│   ├── db/                 # Migrations & seeds
│   ├── controllers/        # Route controllers
│   ├── routes/             # Express routes (modular)
│   ├── services/           # External API + app logic
│   ├── middleware/         # Auth and error middleware
│   ├── loaders/            # Server loader
│   ├── tests/              # Jest/Supertest tests
│── app.js                  # Server entry
│── .env                    # API keys and config
│── jest.config.js          # Jest config
```

---

## ⚙️ Setup Instructions

### Requirements
- Node.js
- PostgreSQL
- A News API Key (e.g. from [NewsAPI.org](https://newsapi.org))

### Installation

```bash
git clone https://github.com/wanderlust-create/sciscope.git
cd sciscope
npm install
cp .env.example .env
# Add your NEWS_API_KEY and DB credentials
npm run migrate
npm run seed
npm run dev
```

---

## 🔑 Authentication

- Users sign up or log in using `/api/v1/auth/signup` or `/login`
- JWT-based authentication
- Protected routes include `/bookmarks` and `/bookmark-groups`

---

## 🔖 Bookmarking Endpoints

### `/api/v1/bookmarks`
- `GET` – Fetch user’s saved bookmarks
- `POST` – Save an article to bookmarks
- `DELETE /:id` – Remove a bookmark

### `/api/v1/bookmark-groups`
- `GET` – List all bookmark groups
- `POST` – Create a new group
- `PATCH /:id` – Rename a group
- `DELETE /:id` – Delete a group

### `/api/v1/bookmark-groups/:groupId/bookmarks/:bookmarkId`
- `POST` – Add a bookmark to a group
- `DELETE` – Remove a bookmark from a group

---

## 🔍 News Search & Feed

### `/api/v1/news`
- `GET` – Fetch general science news (from external API or DB cache)

### `/api/v1/search`
- `GET` – Search science news by keyword
  - Example: `/api/v1/search?keyword=climate`
- `GET /:id` – Get single article by ID (if stored)

---

## 📊 Analytics Endpoints

These are backed by SQL queries and return cached, paginated results.

### `/api/v1/analytics/most-bookmarked-articles`
Returns most frequently bookmarked articles.

### `/api/v1/analytics/top-bookmarking-users`
Returns users with the highest number of bookmarks.

Both support:
- `?page=1&limit=5`

✅ Cached  
✅ Fully tested  
✅ SQL join-backed

---

## 🧪 Testing Overview

SciScope has both unit and integration tests, including **real API calls**.

### 🔬 Real API Call Tests
- `/api/v1/news`
- `/api/v1/search`
- Handles external failures (e.g. invalid key)

### 📊 Analytics Tests
- Pagination + sorting
- Cache hit/miss logic
- Integration with DB seed data

Run all tests:

```bash
npm test
```

---

## 🧠 Notes

- This app uses **Objection.js** for models and some **raw SQL** for analytics.
- Caching is handled via `node-cache`.
- Real API data is seeded into the DB to reduce redundant API calls.

---

## 👩🏽‍🎤 Contributor

Tamara Dowis  
[GitHub](https://github.com/wanderlust-create)  
[LinkedIn](https://www.linkedin.com/in/tamara-dowis/)

---

## 🚧 Future Improvements

- Shareable bookmark groups
- Article categories/tags
- OAuth integration
- Rate limiting per user
