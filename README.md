# Project & Task Management System

* **Backend** – Handles database, authentication, business logic, exports, caching
* **Frontend** – User interface where users manage projects and tasks

When a user performs an action (like creating a task), the frontend sends a request to the backend API, the backend saves data in PostgreSQL, updates cache in Redis, and returns the result to the frontend.

---

## How to Run the Project

### Prerequisites

Make sure you have installed:

* Docker
* Docker Compose
* Node.js 20+
* npm or pnpm

---

### Step 1 – Clone the Repository

```bash
git clone https://github.com/upadhyaykshiti/projectandtaskmanagementsystem.git
cd projectandtaskmanagementsystem
```

---

### Step 2 – Setup Environment Variables

```bash
cp .env.example .env
```

You can keep the default values for local development.

---

### Step 3 – Start Backend (Database + Redis + API)

```bash
docker-compose up --build
```

This will start:

* PostgreSQL database
* Redis
* Backend Express server

Backend will run on:

```
http://localhost:4000
```

Prisma migrations will run automatically when containers start.

---

### Step 4 – Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

## Environment Variables Explained

This project uses a `.env` file to store configuration settings like database connection, authentication secrets, and server setup.

Below is a simple explanation of each variable:

---

### Server Configuration

* **PORT**

  * This is the port where the backend server will run.
  * Default: `4000`
  * You can open the app at `http://localhost:4000`

---

### Database (PostgreSQL with Prisma)

* **DATABASE_URL**

  * This is the connection string used to connect to the PostgreSQL database.
  * Format:

    ```
    postgresql://<username>:<password>@<host>:<port>/<database>
    ```
  * Example:

    ```
    postgresql://postgres:password@localhost:5432/taskdb
    ```

---

### Authentication (JWT)

* **JWT_ACCESS_SECRET**

  * Secret key used to generate access tokens.
  * These tokens are used to authenticate API requests.
  * Keep this value secure.

* **JWT_REFRESH_SECRET**

  * Secret key used to generate refresh tokens.
  * Refresh tokens are used to get new access tokens when they expire.

* **JWT_ACCESS_EXPIRES_IN**

  * Time after which the access token expires.
  * Example: `15m` (15 minutes)

* **JWT_REFRESH_EXPIRES_IN**

  * Time after which the refresh token expires.
  * Example: `7d` (7 days)

---

### Redis Configuration

* **REDIS_HOST**

  * The host where Redis server is running.
  * Default: `127.0.0.1` (localhost)

* **REDIS_PORT**

  * Port on which Redis is running.
  * Default: `6379`

Redis is used for:

* Storing refresh tokens
* Caching data
* Handling background jobs (queues)

---



## Important Technical Features

### Authentication (Login System)

The app uses **JWT access and refresh tokens** for login and session management.
Refresh tokens are stored in Redis, which allows users to be logged out instantly and keeps sessions secure.

### Role-Based Access Control

Different users have different permissions:

* Project Owner can manage members
* Members can create and update tasks
* Only authorized users can export project data

This ensures proper access control and security.

### Redis Caching

Frequently requested data like projects and tasks are cached in Redis to make the application faster.
When data changes, the cache is cleared and updated so users always see the latest information.

### Background Job Processing

CSV export is handled using BullMQ and Redis queues.
This means exports run in the background and do not slow down the application.
If an export fails, the system automatically retries.

### Optimistic UI Updates

When tasks are moved on the Kanban board, the UI updates instantly before the server responds.
If the server request fails, the task moves back to its original position.
This makes the app feel fast and responsive.

### Input Validation

All API inputs are validated using Zod, which ensures only valid data is saved and reduces bugs.

---


## Known Limitations

* CSV exports are stored locally (not cloud storage)
* No email notifications for export completion
* No offline support for task board
* Member search works only with exact email

---


