<p align="center">
  <img src="./backend/assets/sci-scope-banner.png" alt="SciScope Banner" width=700"/>
</p>
<p align="center"><em>Curated science news for educators — fast, filterable, and bookmarkable.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Passing"/>
  <img src="https://img.shields.io/badge/coverage-80%25-yellow" alt="Coverage 80%"/>
  <img src="https://img.shields.io/badge/made%20with-%E2%98%95%EF%B8%8F%20coffee-blue" alt="Made with Coffee"/>
  <img src="https://img.shields.io/badge/made%20with-%F0%9F%92%9C%20love-ff69b4" alt="Made with Love"/>
</p>


# 🔬 SciScope

**SciScope** is a backend API for browsing, searching, and saving science news. It integrates with an external news API and provides user bookmarking, custom bookmark groups, and analytics on top-bookmarked articles and most active users. Built for educators, researchers, and science enthusiasts who want fast, organized access to science news.

---

## ✨ Features

- 🔎 Search science articles by keyword
- 🧠 Fetch trending/general science news
- 🔖 Bookmark articles for later
- 🗂 Organize bookmarks into custom groups
- 📊 Analytics: Most bookmarked articles & top users
- 🧪 External API integration with local caching
- ✅ Full CRUD for bookmarks and groups
- 🔐 Auth with login/signup and protected routes
- 🌐 OAuth integration for third-party login
- 🧪 Full unit, integration, and API testing coverage
- 🧹 Clean camelCase API design
- 🏗️ Easy local setup for rapid development

---

## 📦 Tech Stack

- **Node.js**, **Express**
- **PostgreSQL**, **Knex.js**, **Objection.js**
- **Axios** for external API requests
- **Node-cache** for in-memory caching
- **Jest** and **Supertest** for testing
- **Dotenv**, **camelcase-keys**, **custom logger**

---

## 📁 Folder Structure

```
SciScope/
├── db/                    # Database migrations & seeds
├── src/
│   ├— config/             # Database setup, environment loading
│   ├— controllers/        # Modular route controllers
│   ├— loaders/            # Express app + Logger setup
│   ├— middleware/         # Auth & error handling
│   ├— models/             # Objection.js models (Users, Articles, Bookmarks)
│   ├— routes/             # API v1 routes
│   ├— services/           # Business logic & external API integration
│   ├— utils/              # Helpers (pagination, authentication)
├── tests/                 # Unit and integration tests
├── assets/                # Project banners and media
├── app.js                 # Server entry point
├── .env.example           # Example environment variables
├── SciScope.postman_collection.json  # API Testing Collection
```

---

## ⚙️ Setup Instructions

### Requirements
- Node.js (v18+)
- PostgreSQL
- A News API Key (e.g. from [NewsAPI.org](https://newsapi.org))
- JWT Secret (`JWT_SECRET`)

### Installation

```bash
git clone https://github.com/your-username/sciscope.git
cd sciscope
npm install
cp .env.example .env
cp .env.test.example .env.test
cp .env.postman.example .env.postman
# Add your NEWS_API_KEY, PostgreSQL credentials, and JWT_SECRET
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

## 🗙️ Key Endpoints

### Articles
- `GET /api/v1/news` — Fetch trending science news
- `GET /api/v1/search?keyword=` — Search news by keyword
- `GET /api/v1/articles/:id` — Fetch a specific article by ID

### Bookmarks
- `GET /api/v1/bookmarks` — List user bookmarks
- `POST /api/v1/bookmarks` — Save a new bookmark
- `DELETE /api/v1/bookmarks/:id` — Remove a bookmark

### Bookmark Groups
- `GET /api/v1/bookmark-groups` — List groups
- `POST /api/v1/bookmark-groups` — Create a group
- `PATCH /api/v1/bookmark-groups/:id` — Update a group name
- `DELETE /api/v1/bookmark-groups/:id` — Delete a group
- `POST /api/v1/bookmarks/:bookmarkId/assign/:groupId` — Assign a bookmark to a group
- `DELETE /api/v1/bookmarks/:bookmarkId/remove/:groupId` — Remove a bookmark from a group

### Analytics
- `GET /api/v1/analytics/most-bookmarked-articles` — List most-bookmarked articles
- `GET /api/v1/analytics/top-bookmarking-users` — List users with most bookmarks


---
### Pagination Support

The `/search`, `/news`, `/analytics/most-bookmarked-articles`, and `/analytics/top-bookmarking-users` endpoints support optional pagination:

- `?page=1&limit=5`

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

## 📂 Postman Collection

- Postman Collection available: [SciScope API Postman Collection](./SciScope.postman_collection.json)
- Includes:
  - Public article search
  - Protected bookmark routes
  - Protected bookmark group routes
- Environment variables:
  - `base_url`
  - `jwt_token`

---

## 🧪 Test Coverage

- Statements: **80.58%**
- Branches: **67.85%**
- Functions: **87.91%**
- Lines: **81.05%**

Tested using Jest + Supertest with local PostgreSQL.
---

## 🧠 Notes

- This app uses **Objection.js** for models and some **raw SQL** for analytics.
- Caching is handled via `node-cache`.
- Real API data is seeded into the DB to reduce redundant API calls.

---

## 🚀 Future Improvements

- 🔎 Upgrade search functionality from basic substring matching to PostgreSQL full-text search for better relevance and performance
- 🧾 Add article categories and tags for better filtering
- 🔐 Add auth protection to analytics endpoints
- 🧑‍💻 Build a simple front-end for browsing, searching, and bookmarking
- 📈 Track bookmark timestamps for analytics on usage trends
- 🌐 Implement real OAuth 2.0 with Google or GitHub providers
- 🛠 Deploy live to Render or Railway
- 📑 Add Swagger API documentation

---

## 🤝 Contributing

Pull requests are welcome!  
If you have suggestions for improvements or new features, feel free to open an issue or submit a PR.  
Please ensure all tests pass before submitting.


## 👩🏽‍💻 Author

Tamara Dowis  
[GitHub](https://github.com/wanderlust-create) | [LinkedIn](https://www.linkedin.com/in/tamara-dowis/)


## 🛡 License

Distributed under the [MIT License](LICENSE).  
Feel free to use and adapt SciScope for your own projects!

# 🌟 Thank you for exploring SciScope!


