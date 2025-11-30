# Viva Guide - Competitive Exam Management System

## 1. Project Overview
This is a web-based application allowing:
- **Admins** to create exams and manage questions.
- **Students** to take exams online and get instant results.
It uses a **React** frontend and a **Node.js/Express** backend with a **SQLite** database.

## 2. Key Files & Responsibilities
- **server/index.js**: Entry point, connects to DB and starts server.
- **server/models/**: Defines DB tables (User, Exam, Question).
- **server/controllers/**: Logic for handling requests (e.g., calculating score).
- **client/src/App.js**: Main frontend component with Routing.
- **client/src/pages/TakeExam.js**: Handles the exam timer and submission.

## 3. How it Works
1. **Login**: User logs in, server verifies password (bcrypt) and issues a Token (JWT).
2. **Take Exam**: Frontend fetches questions. Timer starts.
3. **Submit**: Answers sent to server. Server compares with correct options, calculates score, and saves to DB.
4. **Result**: Server returns score and details. Frontend displays it.

## 4. Common Viva Questions
**Q: How is the database connected?**
A: We use **Sequelize**, an ORM that connects to SQLite (a file-based DB) by default. It can be switched to MySQL easily.

**Q: How is the exam timer implemented?**
A: Using React's `useEffect` and `setInterval`. The state `timeLeft` decreases every second. When it hits 0, the exam auto-submits.

**Q: How are passwords stored?**
A: They are hashed using `bcrypt` before saving. We never store plain text passwords.

**Q: What is the purpose of the Token?**
A: It's a JSON Web Token (JWT). It keeps the user logged in and tells the server who the user is (Admin or Student) for every request.
