# 🧪 SciScope

**SciScope** is a science news aggregator built with **Node.js**, **Objection.js (ORM)**, and **PostgreSQL**, integrating external APIs to fetch the latest science-related articles. Users can search for specific topics or browse general science news.

> **Note**: This project is under active development, and features are continuously evolving.  

---

## 📝 Table of Contents  

- [Features](#features)  
- [Setup](#setup)  
- [Folder Structure](#folder-structure)  
- [API Endpoints](#api-endpoints)  
- [Testing](#testing)  
- [Contributors](#contributors)  

---

## ✨ Features <a name="features"></a>  

### 🔍 **Article Search & Science News Fetching**  
- **General Science News (`/api/news`)**: Fetches the latest science news, **prioritizing database results** before making external API calls.  
- **Keyword-Based Search (`/api/articles/search?query=keyword`)**: Users can search for specific articles by title, description, or content.  
- **Smart Data Handling**:  
  - Filters **duplicate articles** before insertion.  
  - Stores only **newer articles**, preventing outdated results.  
  - Ensures **case-insensitive** searches for better accuracy.  
- **Error Handling & Logging**:  
  - Detailed logging with **Winston**.  
  - API call failure handling.  

### 🔒 **Secure API Design**  
- **JWT Authentication (Upcoming Feature)**: Secure authentication for users.  
- **Role-Based Access (Future Feature)**: Admins vs. regular users.  
- **Middleware for Protected Routes**: Ensures only authenticated users can access certain endpoints.  

---

## 💻 Setup <a name="setup"></a>  

### 📌 **Requirements**  
- [Node.js 20+](https://nodejs.org/)  
- [PostgreSQL](https://www.postgresql.org/)  

### 🚀 **Installation**  
1. **Clone the repository**:  
   ```bash
   git clone git@github.com:wanderlust-create/sciscope.git
   ```
2. **Navigate to the project directory**:  
   ```bash
   cd sciscope
   ```
3. **Install dependencies**:  
   ```bash
   npm install
   ```
4. **Set up environment variables**:  
   Create a `.env` file in the root directory with the following:  
   ```bash
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=sciscope
   TEST_DB_NAME=sciscope_test
   JWT_SECRET=your_super_secret_key
   NEWS_API_KEY=your_news_api_key
   ```
5. **Run database migrations**:  
   ```bash
   npx knex migrate:latest
   ```
6. **Start the server**:  
   ```bash
   npm start
   ```
7. **Access the application** at:  
   `http://localhost:3000`  

---

## 📂 Folder Structure <a name="folder-structure"></a>  

```
SciScope/
│── .github/                  # GitHub Actions & workflows
│── coverage/                 # Test coverage reports
│── db/                       # Database-related files
│   ├── migrations/           # Database migrations
│   ├── seeds/                # Seed files (if needed)
│── logs/                     # Application logs
│── node_modules/             # Installed dependencies
│── src/                      # Application source code
│   ├── config/               # Configuration files (knex, env loader, etc.)
│   ├── controllers/          # Route controllers
│   ├── loaders/              # Server initialization & setup
│   ├── middleware/           # Middleware (auth, error handling, etc.)
│   ├── models/               # Database models (Objection.js)
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic & external API calls
│   ├── utils/                # Utility functions
│── tests/                    # Automated tests
│   ├── api/                  # API route tests
│   ├── integration/          # Integration tests
│   ├── unit/                 # Unit tests
│   ├── setupTests.js         # Jest setup
│── .dockerignore             # Docker ignore file
│── app.js                    # App entry point
│── package.json              # Dependencies & scripts
│── README.md                 # Documentation
```

---

## 🔌 API Endpoints <a name="api-endpoints"></a>  

### 📰 **Science News**  
- **`GET /api/news`** – Fetches the latest science news.  
  - Prioritizes stored news in the database before making an API request.  

### 🔍 **Search for Articles**  
- **`GET /api/articles/search?query=keyword`** – Returns articles matching a keyword.  
  - **Case-insensitive** matching.  
  - Filters duplicate and outdated articles.  

---

## 🧪 Testing <a name="testing"></a>  

### ✅ **Running Tests**  
SciScope has a well-structured testing suite with **unit, integration, and real API tests**.  

1. **Run all tests**:  
   ```bash
   npm test
   ```
2. **Run unit tests only**:  
   ```bash
   npm run test:unit
   ```
3. **Run integration tests**:  
   ```bash
   npm run test:integration
   ```
4. **Run real API tests**:  
   ```bash
   npm run test:realapi
   ```

### 📊 **Test Coverage**  
To generate a coverage report:  
```bash
npm run test:coverage
```
The coverage report will be available in the `coverage/` directory.

---

## 👩‍💻 Contributors <a name="contributors"></a>  

- **Tamara Dowis** | [GitHub](https://github.com/wanderlust-create) | [LinkedIn](https://www.linkedin.com/in/tamara-dowis/)  
- 🤖 ChatGPT AI (Assistant)  

---

🚀 **Happy coding!** 🎉

