# GatorMarketPlace
CEN5035 : Software Engineering
Project Name : GatorMarketPlace
Professor Name : Alin Dobra
Semester : Spring 2026


**GatorMarketPlace** is a Gainesville-specific buying and selling platform built exclusively for students.

The goal of the platform is to provide a safe, simple, and campus-focused marketplace where students can buy and sell items such as textbooks, electronics, furniture, bicycles, and other daily-use preowned goods. Unlike generic marketplaces, GatorBazaar is restricted to students, helping reduce scams and ensuring that transactions happen within the local student community.

The platform allows users to create accounts, list items for sale with images and descriptions, browse and search for nearby listings, and directly communicate with sellers. Since it is focused only on Gainesville students, the system encourages quick in-person exchanges and affordable pricing, especially for students moving in and out of on campus and off campus housing.

GatorBazaar aims to make student-to-student commerce more reliable, convenient, and community-driven.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed:
- **Node.js** (for Frontend) - [Download Here](https://nodejs.org/)
- **Go** (for Backend) - [Download Here](https://go.dev/dl/)

---

### 🛠️ Running the Project

#### 1️⃣ Backend (Go)

The backend runs on port `8080`.

**Windows:**
1. Navigate to the `backend` directory:
   ```cmd
   cd backend
   ```
2. Run the start script:
   ```cmd
   run.bat
   ```

**Mac / Linux:**
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Give execution permission to the script (first time only):
   ```bash
   chmod +x run.sh
   ```
3. Run the script:
   ```bash
   ./run.sh
   ```

Alternatively, you can run it directly with Go:
```bash
go run main.go
```

#### 2️⃣ Frontend (React + Vite)

The frontend runs on `http://localhost:5173` (or the port shown in your terminal).

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Backend Tests (Go)

```bash
cd backend
go test ./... -v
```

Or use the batch script (Windows):
```cmd
cd backend
run_test.bat
```

### Frontend Unit Tests (Vitest)

```bash
cd frontend
npm run test
```

### Frontend E2E Tests (Cypress)

1. Install Cypress (first time only — already in devDependencies):
   ```bash
   cd frontend
   npm install
   ```

2. Start the frontend dev server in one terminal:
   ```bash
   cd frontend
   npm run dev
   ```

3. Run Cypress in headless mode (separate terminal):
   ```bash
   cd frontend
   npx cypress run
   ```

4. Or open Cypress interactively:
   ```bash
   cd frontend
   npx cypress open
   ```

> **Note:** Cypress E2E tests require the frontend dev server to be running before execution.

---

## Team Members
- Prathmesh Santosh Choudhari – Frontend Engineer
- Varun Bohara – Frontend Engineer
- Andrew Rippy – Backend Engineer
- Dhananjay Sabhahit – Backend Engineer

---

## Tech Stack (Planned)
- Frontend: React
- Backend: GoLang

---

## One-line explanation
“We’re building a Gainesville-only marketplace for students so buying and selling preowned items stays local, safer, and more student-friendly.”

---
