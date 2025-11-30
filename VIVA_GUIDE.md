# Viva Guide: Competitive Exam Management System

## Project Overview
**Q: What is the purpose of this project?**
A: To provide a robust, secure, and user-friendly platform for conducting competitive exams online. It streamlines the process for admins (creating banks, scheduling exams) and students (taking exams with integrity features).

**Q: What tech stack did you use and why?**
A: 
- **React (Frontend)**: For a dynamic, single-page application experience with fast UI updates.
- **Node.js & Express (Backend)**: For a scalable, non-blocking API that handles concurrent requests efficiently.
- **Sequelize (ORM)**: To interact with the database using JavaScript objects, making it easy to switch between SQL dialects (SQLite/MySQL).

## Key Features & Implementation

### 1. Security & Integrity
**Q: How do you prevent cheating?**
A: 
- **Frontend**: We disable the back button, show warnings on tab switching (visibility API), and prevent right-click/copy-paste.
- **Backend**: Questions are fetched securely. Results are calculated on the server to prevent client-side manipulation.

### 2. Question Bank Management
**Q: How does the Bulk Import work?**
A: We use a custom parser (regex-based) to extract questions, options, and answers from text or PDF files (`pdf-parse`). It supports multiple formats (numbered, CSV-like) and includes a **Preview Step** where admins can validate data before it touches the database.

**Q: How is the Export implemented?**
A: We use specific libraries for each format: `json2csv` for CSV, `xlsx` for Excel, `pdfkit` for PDF, and `docx` for Word. The backend streams these files to the client with appropriate headers (`Content-Disposition`).

### 3. Subject Isolation
**Q: How do you ensure questions belong to the right subject?**
A: Every question has a `SubjectId` foreign key. When creating an exam, we filter questions by this ID. We also implemented a "Move" feature that updates this foreign key transactionally.

### 4. Scalability
**Q: How would you scale this?**
A: 
- **Database**: Switch from SQLite to PostgreSQL/MySQL (already supported via Sequelize).
- **Caching**: Implement Redis to cache frequent queries like "Get All Subjects" or "Get Exam Questions".
- **Load Balancing**: Run multiple instances of the Node.js server behind Nginx.

## Code Structure
- **MVC Pattern**: Models (DB schema), Views (React Components), Controllers (Business Logic).
- **Middleware**: `authMiddleware.js` handles JWT verification and Role-Based Access Control (RBAC).

## Challenges Faced
- **PDF Parsing**: Extracting structured data from unstructured PDF text was tricky. I solved it by using flexible regex patterns and a preview step for manual verification.
- **State Management**: Handling the timer and auto-save during the exam required careful state management in React to ensure no data is lost on refresh.
