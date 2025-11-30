# Competitive Exam Management System (Production Ready)

A comprehensive, full-stack web application for managing and taking competitive exams, featuring a modern dark/neon UI, advanced admin controls, and robust student assessment tools.

## Key Features

### 🎨 UI/UX Overhaul
- **Modern Dark Theme**: Consistent neon-accented dark mode across all pages.
- **Responsive Layouts**: Full-width Login/Register pages and a responsive Dashboard with Sidebar/TopNav.
- **Polished Components**: Custom cards, badges, modals, and toast notifications.

### 👨‍💻 Admin Dashboard
- **Advanced Question Bank**: 
    - **Search & Filter**: Filter by Subject, Difficulty, Date Range.
    - **Selection & Bulk Actions**: Select multiple questions to **Export** or **Move** them in bulk.
    - **Multi-Format Export**: Export questions to **JSON, CSV, XLSX, PDF, or DOCX**.
    - **Bulk Import**: Paste text or upload PDF with a **Preview Modal** that highlights errors and allows row exclusion.
- **Subject Management**:
    - **Strict Isolation**: Questions are strictly tied to subjects.
    - **Move Questions**: Easily move questions between subjects (individually or in bulk).
    - **Custom Subjects**: Create new subjects on the fly during question creation or move.
- **User Management**: 
    - View all users with search and role filters.
    - **Actions**: Promote to Admin, Demote to Student, Reset Password.
- **Exam Management**: Create exams with specific durations and question counts. Toggle "Draft/Published" status.

### 🎓 Student Experience
- **Exam Interface**: 
    - **Auto-Save**: Answers are saved locally to prevent data loss on reload.
    - **Integrity**: Browser navigation warnings and disabled back button.
    - **Timer**: Sticky countdown timer.
    - **Question Palette**: Flag questions for review and filter by status.
- **Instant Results**: Detailed score breakdown immediately after submission.

## Setup Instructions

1.  **Install Dependencies**:
    Open a terminal in the project root and run:
    ```bash
    npm run install-all
    ```
    *This will install dependencies for the root, server, and client.*

2.  **Database Setup**:
    - The system supports SQLite (default for dev/test) and MySQL/PostgreSQL.
    - **Seeding**: Populate the database with realistic data (Subjects: English, Math, Science, Reasoning, CS, GK, Urdu, Social Studies).
    ```bash
    npm run seed -- --force
    ```
    *Use `--force` to reset the database and re-seed from scratch.*

3.  **Run Application**:
    ```bash
    npm start
    ```
    *This will launch both the Server (port 5000) and Client (port 3000) concurrently.*

## Testing

The project includes automated backend tests for critical functionalities like Export and Question Movement.

To run the tests:
```bash
cd server
npm test
```
*Note: Tests run in an in-memory SQLite database and do not affect your main data.*

## Feature Guides

### Exporting Questions
1.  Go to **Question Bank**.
2.  **Export All**: Click "Export Questions" in the filter bar. Select format (CSV, PDF, etc.) and filters.
3.  **Export Selected**: Check the boxes next to specific questions. Click "Actions" > "Export Selected".

### Moving Questions
1.  **Single**: Click the "Move" button on a question row. Select the new subject.
2.  **Bulk**: Select multiple questions. Click "Actions" > "Move Selected". Choose the target subject.

### Bulk Import
1.  Click "Bulk Paste" or "Upload PDF".
2.  Paste questions in the format: `Q. Question text... A) Option1... Answer: A`.
3.  Click "Preview Import".
4.  Review the parsed questions. Uncheck any invalid rows.
5.  Click "Confirm Import".

## Credentials
- **Admin**: `admin@demo.com` / `Admin123`
- **Student**: `student@demo.com` / `Student123`

## Tech Stack
- **Frontend**: React, CSS Modules (Dark Theme), Axios.
- **Backend**: Node.js, Express, Sequelize (SQLite/MySQL).
- **Libraries**: `pdf-parse`, `json2csv`, `xlsx`, `pdfkit`, `docx`, `bcrypt`, `jest`, `supertest`.
