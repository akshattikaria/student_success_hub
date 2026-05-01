# USILAS - University-Scale Intelligent Learning Analytics System

**USILAS** is a proactive, data-driven academic decision-support prototype. It shifts traditional university academic monitoring from a reactive, post-examination model to a real-time, predictive system. By continuously evaluating attendance and assessment data, USILAS identifies at-risk students early, provides actionable suggestions, and facilitates structured academic interventions.

This repository contains the **Phase 1 Prototype**, featuring a full React frontend and a lightweight Node.js/Express backend utilizing JSON-based persistent storage.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Secure, token-based routing and isolated dashboards for 5 distinct roles: Student, Teacher, Academic Advisor, Head of Department (HOD), and Administrator.
*   **Predictive Risk Scoring:** Real-time calculation of academic risk (0-100) based on attendance and performance matrices.
*   **Early Warning & Suggestions:** Automated alert generation for high-risk students accompanied by actionable, data-driven improvement suggestions.
*   **Intervention State Machine:** A structured workflow for Academic Advisors to log counseling records and track formal intervention plans (Pending -> Active -> Completed).
*   **Institutional Analytics:** High-level dashboards for HODs and Admins detailing cohort risk distributions, department-wide trends, and user management.

## 💻 Tech Stack

**Frontend:**
*   React 18 (Vite)
*   TypeScript
*   Tailwind CSS & Shadcn UI (Component Library)
*   Recharts (Data Visualization)
*   React Router DOM (Routing)

**Backend:**
*   Node.js & Express.js
*   JSON File Persistence (Custom `fs` Write Queue)
*   CORS & Crypto (Session Management)

## 🛠️ Installation & Setup

To run this project locally, you must start both the backend server and the frontend development server. 

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   Git

### 1. Start the Backend Server
The backend handles authentication, data persistence, and API routing on **Port 5000**.
```bash
# Navigate to the backend directory
cd backend

# Install backend dependencies
npm install

# Start the server
npm run dev
# OR: node server.js
```
*You should see: `USILAS backend running on http://localhost:5000`*

### 2. Start the Frontend Application
Open a **new, separate terminal window** for the frontend, which runs on **Port 8080**.
```bash
# Navigate to the root project directory
cd student-success-hub-main

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
*Navigate to `http://localhost:8080` in your browser.*

## 🔐 Demo Accounts & Testing

The login page features "Demo Role" shortcuts for quick testing. Clicking a role automatically fills in the credentials for a test account. Alternatively, you can use the following credentials manually (Password for all accounts is `student123`, `teacher123`, etc., or as defined in `users.json`):

| Role | Email | Password | Dashboard Focus |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.sharma@university.edu` | `student123` | Personal risk score, alerts, actionable suggestions. |
| **Teacher** | `priya.nair@university.edu` | `teacher123` | Class analytics, at-risk filtering, updating student marks. |
| **Advisor** | `rahul.verma@university.edu` | `advisor123` | Counseling logs, triggering and managing interventions. |
| **HOD** | `hod@vjti.edu` | `password` | Department-wide risk distributions and faculty oversight. |
| **Admin** | `meera.iyer@university.edu` | `admin123` | User directory management (CRUD) and institutional reports. |

## 🧪 Testing Notes (Phase 1 Prototype)

*   **Database:** This prototype utilizes local `.json` files (`backend/data/`) to simulate a database. Do not delete these files, as they act as the system's persistent state.
*   **State Machine Enforcement:** The Intervention module strictly enforces state transitions. Attempting to revert a "Completed" intervention to "Active" will yield a `422 Unprocessable Entity` error, satisfying system test requirements.
*   **Data Flow:** Updating a student's marks or attendance via the Teacher Dashboard dynamically recalculates their risk score, which will be immediately reflected upon logging into that specific Student's dashboard.

---
*Developed for Software Engineering Laboratory - VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE (VJTI).*
```
