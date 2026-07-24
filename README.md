# Hostel Management System (MERN Stack)

A complete, production-level Hostel Management System built with the MERN stack (MongoDB, Express, React 19, Node.js), featuring Role-Based Access Controls (Super Admin, Hostel Admin, Student), JWT authentication, image uploads, and transaction checkouts.

---

## Folder Structure

```
hostel-management-system/
├── client/          # Vite + React 19 frontend
└── server/          # Node.js + Express backend
```

---

## Getting Started

### 1. Prerequisite
Ensure you have Node.js (v18+) and MongoDB installed and running locally.

### 2. Configure Environment Variables
- Navigate to the `server` directory.
- Open the `.env` file and verify or edit database connection variables:
  ```env
  PORT=5000
  MONGODB_URI=mongodb://127.0.0.1:27017/hostel-db
  JWT_ACCESS_SECRET=super_secret_jwt_access_token_key_12938102
  JWT_REFRESH_SECRET=super_secret_jwt_refresh_token_key_98234710
  ```

### 3. Run Backend Server
From the root directory:
```bash
cd server
npm run dev
```
The server will start listening at `http://localhost:5000`.

### 4. Run Frontend Client
From the root directory:
```bash
cd client
npm run dev
```
The client dashboard will start running at `http://localhost:5173`.

---

## Credentials for Testing
You can select a role (Student, Hostel Admin, Super Admin) directly on the **Register Screen** for easy developer setup. Once registered, check the **Server console logs** for the Email Verification link to activate the account.
