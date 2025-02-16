# 🧪 SciScope

**SciScope** is a science news aggregator built with Node.js, Objection.js (ORM), and JWT authentication, integrating external APIs to fetch the latest science-related articles. Users can sign up and log in via OAuth (Google, GitHub) or email/password authentication.
> **Note**: This is an actively developed project and is currently in its early stages. Features and functionality are continuously being expanded.


## 📝 Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Folder Structure](#folder-structure)
- [Schema](#schema)
- [Contributors](#contributors)

---

## ✨ Features <a name="features"></a>

### 🔹 Authentication
- **OAuth Authentication**: Users can sign up/login via Google or GitHub.
- **Email & Password Authentication**: Secure login with hashed passwords using **bcrypt**.
- **JWT Authentication**: Users receive a token upon login to authenticate future requests.
- **Logout with Token Blacklisting**: Users can securely log out, preventing token reuse.

### 🔹 Science News Fetching
- **Integrated with News API**: Fetches real-time **science news** articles.
- **Error Handling**: Handles API failures gracefully.
- **Caching (Upcoming Feature)**: Plans to reduce API calls and improve response speed.

### 🔹 Secure API Design
- **Role-Based Access (Future Feature)**: Admins vs. regular users.
- **Middleware for Protected Routes**: Ensures only authenticated users can access certain endpoints.
- **Logging with Winston**: Centralized logging for debugging and monitoring.

---

## 💻 Setup <a name="setup"></a>

### Requirements:
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation:
1. Clone the repository:  
   ```bash
   git clone git@github.com:wanderlust-create/sciscope.git
   ```
2. Navigate to the project directory:  
   ```bash
   cd sciscope
   ```
3. Install dependencies:  
   ```bash
   npm install
   ```
4. Set up the environment variables by creating a `.env` file:
   ```
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   TEST_DB_NAME=your_test_db
   JWT_SECRET=your_super_secret_key
   NEWS_API_KEY=your_news_api_key
   ```
5. Run database migrations:  
   ```bash
   npx knex migrate:latest
   ```
6. Start the server:  
   ```bash
   npm start
   ```
7. Access the application at:  
   `http://localhost:3000`

---

## 📂 Folder Structure <a name="folder-structure"></a>

```
SciScope/
│── .github/
│   ├── workflows/
│   │   ├── ci.yml
│── coverage/                # Test coverage reports
│── db/                      # Database-related files
│   ├── migrations/          # Database migration files
│   ├── schemas/             # Database schemas
│── logs/                    # Application logs
│── node_modules/            # Installed dependencies
│── src/                     # Application source code
│   ├── config/              # Configuration files (knex, env loader, etc.)
│   ├── controllers/         # Route controllers
│   ├── loaders/             # Server initialization & app setup
│   ├── logs/                # Log handling
│   ├── middleware/          # Middleware (auth, error handling, etc.)
│   ├── models/              # Database models (Objection.js)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic & external API calls
│   ├── utils/               # Utility functions
│── tests/                   # Automated tests
│   ├── api/                 # API endpoint tests
│   ├── integration/         # Integration tests
│   ├── unit/                # Unit tests
│   │   ├── models/          # Model unit tests
│   │   ├── services/        # Service unit tests
│   ├── globalTeardown.js    # Jest global teardown script
│   ├── setupTests.js        # Jest setup
│── .dockerignore            # Docker ignore file
│── app.js                   # App entry point

```

---

## 🗟 Schema <a name="schema"></a>

### Database Tables:
- **Users**:
  - `id`, `username`, `email`, `passwordHash`, `oauthProvider`, `oauthId`, `created_at`, `updated_at`
- **Articles**:
  - `id`, `title`, `source`, `url`, `publishedAt`, `summary`
- **Blacklisted Tokens**:
  - `id`, `token`, `created_at`

---

## 👩🏽‍💻 Contributors <a name="contributors"></a>

- **Tamara Dowis** | [GitHub](https://github.com/wanderlust-create) | [LinkedIn](https://www.linkedin.com/in/tamara-dowis/)
- 🤖 ChatGPT AI (Assistant)

   git clone git@github.com:wanderlust-create/sciscope.git
