<p align="center">
  <img src="./assets/sci-scope-banner.png" alt="SciScope Banner" width=700"/>
</p>
<p align="center"><em>Curated science news for educators — fast, filterable, and bookmarkable.</em></p>

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
- 🌐 OAuth integration for third-party login

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
├── db/                     # Migrations & seeds
├── src/
│   ├── config/             # Knex config, db-setup
│   ├── controllers/        # Route controllers
│   ├── loaders/            # Logger, Express server
│   ├── middleware/         # Auth and error handling
│   ├── models/             # Objection.js models
│   ├── routes/             # Modular API routing
│   ├── services/           # API, database, and logic layers
│   ├── utils/              # Pagination, auth helpers, etc.
├── tests/                  # Jest/Supertest test suites
├── app.js                  # App entry point
├── .env                    # Environment variables
├── jest.config.js          # Jest test config
```

---

## ⚙️ Setup Instructions

### Requirements
- Node.js
- PostgreSQL
- A News API Key (e.g. from [NewsAPI.org](https://newsapi.org))
- JWT Secret (`JWT_SECRET`)

### Installation

```bash
git clone https://github.com/wanderlust-create/sciscope.git
cd sciscope
npm install
cp .env.example .env
# Add your NEWS_API_KEY, DB credentials, and JWT_SECRET
npm run migrate
npm run seed
npm run start
```

---

## 🔑 Authentication

- Users sign up or log in using `/api/v1/auth/signup` or `/login`
- OAuth login is available via `/api/v1/auth/oauth`
- JWT-based authentication (`JWT_SECRET` required)
- Protected routes include:
  - `/bookmarks`
  - `/bookmark-groups`

_Note: Analytics endpoints are currently public but may be protected in future versions._

---

## 🔖 Bookmarking Endpoints

### `/api/v1/bookmarks`
- `GET` – Fetch user’s saved bookmarks
- `POST` – Save an article to bookmarks
- `DELETE /:id` – Remove a bookmark

### `/api/v1/bookmark-groups`
- `GET` – List all bookmark groups
- `POST` – Create a new group
- `PATCH /:id` – Update group name
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

SciScope includes unit tests, integration tests, and real API call tests.

### Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run internal-only tests (excludes real API). |
| `npm run test:real` | Run tests that hit the external news API. |
| `npm run test:all` | Run everything (internal + real API tests). |
| `npm run test:quick` | Skip DB reset for faster test runs. |
| `npm run test:watch` | Watch mode during development. |

> ⚠️ `test:real` and `test:all` require a valid `NEWS_API_KEY` in your `.env`.

---

## 🧠 Notes

- This app uses **Objection.js** for models and some **raw SQL** for analytics.
- Caching is handled via `node-cache`.
- Real API data is seeded into the DB to reduce redundant API calls.

---

## 🚧 Future Improvements

- 🔐 Add auth protection to analytics endpoints
- 🧾 Article categories and tags for filtering
- 🧑‍💻 Simple front-end for browsing/searching/bookmarking articles
- 📈 Track bookmark timestamps for usage trends
- 🗂 Public/shareable bookmark groups
- 🧪 Improve test coverage for edge cases (e.g. expired tokens)

---

## 👩🏽‍🎤 Contributor

Tamara Dowis  
[GitHub](https://github.com/wanderlust-create)  
[LinkedIn](https://www.linkedin.com/in/tamara-dowis/)
