# LearnSpace LMS

### A Full-Stack Learning Management System

LearnSpace LMS is a web-based Learning Management System built to simplify online education. It provides separate role-based dashboards for Students, Instructors, and Administrators, allowing users to manage courses, lessons, enrollments, and learning activities through a centralized platform.

## Features

### Student
- Student registration and login
- Browse available courses
- Enroll in courses
- Demo payment checkout for paid courses
- Successful and failed payment handling
- Access enrolled course lessons
- Track learning progress
- View live classes
- My Learning dashboard

### Instructor
- Instructor dashboard
- Create, update, and manage courses
- Add and manage course lessons
- Manage live classes
- View enrolled student counts
- Track course revenue
- View payment and revenue information

### Admin
- Admin dashboard
- Manage students and instructors
- Manage courses and platform activities
- Monitor platform information

## Project Screenshots

### Student Dashboard
![Student Dashboard](Screenshots/student-dashboard.png)

### Instructor Dashboard
![Instructor Dashboard](Screenshots/Instructorsdashboard.png)

### Admin Dashboard
![Admin Dashboard](Screenshots/admin-dashboard.png)

## Technologies Used

**Frontend**
- React.js
- HTML5
- CSS3
- JavaScript
- Vite

**Backend**
- Node.js
- Express.js
- REST APIs

**Database**
- MongoDB
- Mongoose

**Tools**
- Visual Studio Code
- Git and GitHub
- Postman

## Project Structure

```text
LearnSpace-LMS/
├── client/             # React frontend
├── server/             # Node.js backend
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/mishrasakshi10/LearnSpace-LMS.git
cd LearnSpace-LMS
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Add all other environment variables required by your backend configuration. Never upload actual credentials or secret keys to GitHub.

### 5. Run the application

Start the backend and frontend in separate terminals using the scripts configured in their respective `package.json` files.

## Future Enhancements

- Advanced learning analytics
- Course ratings and reviews
- Enhanced live learning features
- Improved learning progress reports

## Author

**Sakshi Mishra**

B.Sc. Information Technology Graduate

GitHub: [@mishrasakshi10](https://github.com/mishrasakshi10)

---

*LearnSpace LMS – Making online learning more accessible and organized.*