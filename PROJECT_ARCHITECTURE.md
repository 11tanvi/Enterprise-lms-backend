# Xebia & EduCorp LMS — Technical & Project Architecture Report

## 1. Executive Summary & Overview
**Xebia LMS / EduCorp LMS** is a full-stack, enterprise-grade Learning Management System (LMS) built with **Spring Boot** (Java backend) and **React + Vite** (TypeScript frontend). The application is designed to support three distinct user roles (Administrators, Teachers, and Students) in managing course taxonomies, authoring complex curricula, attaching multimedia assets, enrolling students into learning cohorts (batches), and assessing performance through interactive multi-question assignments (including multiple-choice, essay, short-answer, and mock coding environments).

The system supports robust role-based access control, a secure stateless JWT authentication flow, and standard database persistence backed by PostgreSQL, managed via Flyway schema migrations, and pre-seeded for testing.

---

## 2. Directory & Folder Structure

### 2.1 Backend Project Structure
The backend is a Maven-based Spring Boot application located under the `/backend` directory.

```
/backend
├── src/main/java/com/geeknito/geeknito_backend
│   ├── config                  # Security, JWT, CORS, Database Seeder configs
│   │   ├── DatabaseSeeder.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── JwtService.java
│   │   └── SecurityConfig.java
│   ├── category                # Category Taxonomy Management Module
│   │   ├── controller          # CategoryController & CategoryAdminController
│   │   ├── dto                 # Request/Response Category DTOs
│   │   ├── repository          # CategoryRepository
│   │   └── service             # CategoryService (Interface & Implementation)
│   ├── course                  # Course & Curriculum Module
│   │   ├── controller          # CourseAdmin, CourseCatalog, Curriculum, Content, Enrollment
│   │   ├── dto                 # Course, Module, Submodule, Content DTOs
│   │   ├── repository          # Course, Module, Submodule, Content, Enrollment Repositories
│   │   └── service             # Admin, Catalog, Curriculum, Content, Enrollment Services
│   ├── batch                   # Batch Cohort Module
│   │   ├── controller          # BatchController
│   │   ├── dto                 # Batch DTOs
│   │   ├── repository          # BatchRepository, BatchStudentRepository
│   │   └── service             # BatchService (Interface & Implementation)
│   ├── assignment              # Assessments & Grading Module
│   │   ├── controller          # AssignmentController, QuestionController, SubmissionController
│   │   ├── dto                 # Assignment, Question, StudentAnswer, Submission DTOs
│   │   ├── repository          # Assignment, Question, StudentAnswer, Submission Repositories
│   │   └── service             # Assignment, Question, Submission Services
│   ├── entity/learning         # Central Database Entities & JPA mappings
│   │   ├── UserEntity.java
│   │   ├── CategoryEntity.java
│   │   ├── CourseEntity.java
│   │   ├── ModuleEntity.java
│   │   ├── SubmoduleEntity.java
│   │   ├── ContentEntity.java
│   │   ├── EnrollmentEntity.java
│   │   ├── BatchEntity.java
│   │   ├── BatchStudentEntity.java
│   │   ├── AssignmentEntity.java
│   │   ├── AssignmentBatchEntity.java
│   │   ├── QuestionEntity.java
│   │   ├── QuestionOptionEntity.java
│   │   ├── SubmissionEntity.java
│   │   └── StudentAnswerEntity.java
│   └── user
│       ├── controller          # AuthController (Login & Register)
│       └── repository          # UserRepository
└── src/main/resources
    ├── application.properties  # Spring Boot configuration
    └── db/migration            # Flyway SQL migrations (V1 to V6)
```

### 2.2 Frontend Project Structure
The frontend is a React SPA built on Vite, located under the `/frontend` directory.

```
/frontend
├── src
│   ├── App.tsx                 # App routing definition & layout wrapper
│   ├── index.css               # Global styling entry point with Tailwind imports
│   ├── main.tsx                # React virtual DOM mounting point
│   ├── types.ts                # Entry point exporting all type modules
│   ├── assets/                 # Brand assets (White/Purple logos)
│   ├── components/             # Global reusable layout components
│   │   ├── Header.tsx          # Responsive Top Navbar
│   │   ├── Sidebar.tsx         # Unified Navigation Drawer (handles Admin/Teacher/Student links)
│   │   ├── ProtectedRoute.tsx  # Auth guard block validation
│   │   └── Toast.tsx           # UI notification banner component
│   ├── context/
│   │   └── AppContext.tsx      # Centralized session state (user, roles, UI toggles, Toasts)
│   ├── data/
│   │   └── initialData.ts      # Offline Catalog fallback data
│   ├── lib/
│   │   ├── apiClient.ts        # Axios HTTP client instance (headers, interceptors)
│   │   └── brandConfig.ts      # Branding & configuration defaults
│   ├── providers/
│   │   └── QueryProvider.tsx   # React Query (TanStack Query) query client configuration
│   ├── services/               # Base REST services (Catalog, categories, contents, enrollments)
│   │   ├── authService.ts
│   │   ├── categoryService.ts
│   │   ├── courseService.ts
│   │   ├── curriculumService.ts
│   │   └── enrollmentService.ts
│   ├── types/                  # Structured TypeScript definitions
│   │   ├── auth.ts, course.ts, batch.ts, assignment.ts, common.ts
│   └── modules/                # Feature-encapsulated workspaces
│       ├── courses/            # Catalog Management Viewpages
│       └── assignments/        # Assessment Platform Module
│           ├── api/            # API services (assignmentService.ts)
│           ├── types/          # Specialized assessment typing declarations
│           ├── utils/          # Mock local fallback managers (mockAssignments.ts)
│           └── pages/          # Student & Teacher viewpages
```

---

## 3. Core Architectural Modules & Functional Scope

### 3.1 Authentication & Authorization Module
*   **Purpose:** Ensures secure entry into the LMS, maintaining user profiles and gating access based on role types (`admin`, `teacher`, `student`).
*   **Entities involved:** `UserEntity` (roles: `admin`, `teacher`, `student`, `isActive` flag).
*   **APIs:** `/auth/login`, `/auth/register` (POST).
*   **Logic Flow:**
    1.  User enters credentials into the UI.
    2.  `AuthController` authenticates via password hashing evaluation.
    3.  A JWT is returned on success.
    4.  Client stores the token in LocalStorage and injects it into subsequent request headers.
    5.  `ProtectedRoute` component gates pages based on roles.

### 3.2 Category & Taxonomy Management
*   **Purpose:** Organizes curriculum topics into specialized tracks (e.g., *Cybersecurity*, *Software Engineering*).
*   **Entities involved:** `CategoryEntity`.
*   **APIs:** `/categories` (GET/POST/PUT/DELETE) and `/api/categories`.
*   **Logic Flow:** Admins add, edit, and soft-delete categories, selecting custom visual cues (Unicode icons and hex color codes) used to style cards in the course discovery page.

### 3.3 Course Creator & Curriculum Wizard
*   **Purpose:** Implements a step-by-step full-scale course creation experience.
*   **Wizard Steps:**
    *   **Step 1:** Meta Setup (Title, Slug, Category, Duration, Levels, SEO, Thumbnail).
    *   **Step 2:** Curriculum Builder (Modules and Submodules/Lessons).
    *   **Step 3:** Content Attachment (Markdown texts, HTML embeds, code scripts, video links, file uploads).
    *   **Step 4:** Review & Launch (Confirm curriculum structure and toggling publication status).
*   **Entities involved:** `CourseEntity`, `ModuleEntity`, `SubmoduleEntity`, `ContentEntity`.

### 3.4 Cohorts & Batches Module
*   **Purpose:** Groups enrolled students into cohorts to manage class schedules and isolate student assignments.
*   **Entities involved:** `BatchEntity`, `BatchStudentEntity`.
*   **APIs:** `/batches` endpoints.
*   **Logic Flow:** Administrators set start/end dates and map student lists to batches. Students can browse and enroll themselves in specific batches.

### 3.5 Assignment, Attempt & Grading Platform
*   **Purpose:** Promotes deep evaluation of concepts through structured assignments.
*   **Features:**
    *   **Multi-Type Questions:** MCQ (Multiple Choice), Essay (Paragraph), Short Answer, File Upload, and Coding questions.
    *   **Coding Simulator:** Features a real-time responsive browser code editor with syntax highlighting, language selector, pre-configured starter code, and interactive test case runs.
    *   **Attempt Tracker:** Implements a full exam interface showing active duration timers, submission states, autosaving drafts, and detailed exam-mode safety states.
    *   **Grader View (Teacher):** Enables teachers to review all student attempts, award marks per question, and input custom feedback text.
*   **Entities involved:** `AssignmentEntity`, `QuestionEntity`, `QuestionOptionEntity`, `SubmissionEntity`, `StudentAnswerEntity`.

---

## 4. Entity Relationships & Database Model

The database represents a rich relational schema managed by JPA Hibernate and Flyway migrations:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                            |
         +------------------+------------------+
         | 1                                   | 1
         |                                     |
         | *                                   | *
+-----------------+                   +-------------------+
|   enrollments   |                   |  batch_students   |
+-----------------+                   +-------------------+
         | *                                   | *
         |                                     |
         | 1                                   | 1
+-----------------+                   +-------------------+
|     courses     |-------------------|      batches      |
+-----------------+ 1               * +-------------------+
         | 1                                   | 1
         |                                     |
         | *                                   | *
+-----------------+                   +-------------------+
|     modules     |                   |assignment_batches |
+-----------------+                   +-------------------+
         | 1                                   | *
         |                                     | 1
         | *                                   |
+-----------------+                   +-------------------+
|   submodules    |                   |    assignments    |
+-----------------+                   +-------------------+
         | 1                                   | 1
         |                                     |
         | *                                   | *
+-----------------+                   +-------------------+
|    contents     |                   |     questions     |
+-----------------+                   +-------------------+
                                               | 1
                                               |
                                               | *
                                      +-------------------+
                                      |  question_options |
                                      +-------------------+
                                               | 1
                                               |
                                               | *
                                      +-------------------+
                                      |  student_answers  |
                                      +-------------------+
                                               | *
                                               | 1
                                      +-------------------+
                                      |    submissions    |
                                      +-------------------+
```

### Relational Summary:
1.  **Users to Enrollments / Batch Students:** One user (`student` role) can have multiple enrollments in courses, and can join multiple cohort batches.
2.  **Courses to Modules, Submodules & Contents:** Standard cascading 1-to-Many tree model. Deleting a course cleanly cascadingly removes nested modules, submodules, and content records.
3.  **Batches to Course:** Each cohort batch belongs to a single course. Multiple batches can run in parallel for a single course.
4.  **Assignments to Batches:** Guided by `assignment_batches` join entity to distribute specific tests to designated cohorts.
5.  **Assignments to Questions & Options:** Multiple questions belong to an assignment, and each MCQ question contains multiple options.
6.  **Submissions & Student Answers:** A student submits a single `SubmissionEntity` per assignment. This submission holds multiple `StudentAnswerEntity` lines mapped to corresponding `QuestionEntity` records.

---

## 5. End-to-End Application Workflows

### 5.1 Administrator Workflow
```
Login as Admin ──> Manage Taxonomy ──> Run Course Wizard ──> Setup Batches ──> Enroll Students
```
1.  **Auth:** Enters `admin@educorp.com` / `adminpass123` on `/login`.
2.  **Taxonomy:** Navigates to `/categories` to create or modify categories.
3.  **Course Design:** Launches `/wizard` to design modules, submodules, and lessons.
4.  **Group Sync:** Creates cohorts for courses, scheduling start/end dates.

### 5.2 Teacher Workflow
```
Login as Teacher ──> Select Course ──> Create Assignment ──> View Submissions ──> Award Marks & Feedback
```
1.  **Auth:** Enters `teacher@educorp.com` / `teacherpass123` on `/login`.
2.  **Assessment Design:** Navigates to `/teacher/dashboard` to create assignments with custom MCQ options, essay constraints, or coding challenges.
3.  **Grading Hub:** Selects a submission in `/teacher/dashboard` (Grading Tab), reviews the student answers, awards grades, writes feedback, and submits the finalized score.

### 5.3 Student Workflow
```
Login ──> Course Catalog ──> Enroll ──> Browse Batches ──> Read Submodules ──> Attempt Assignment ──> View Results
```
1.  **Auth:** Enters `student@educorp.com` / `studentpass123` on `/login`.
2.  **Discovery:** Navigates to the Course Catalog (`/courses`), selects a course, and clicks **Enroll**.
3.  **Cohorts:** Navigates to `Browse Batches` to join a cohort of an enrolled course.
4.  **Learning:** Reads through lessons, watches videos, and opens PDF attachments.
5.  **Assessment:** Opens `/student/dashboard` to select an assignment, starts the quiz (initializing timers), inputs answers, and submits before time runs out.
6.  **Review:** Redirected to `/student/result/{id}` to view detailed grades, auto-marked MCQs, and teacher comments.

---

## 6. Routing Catalog (Frontend Page Maps)

| React Route Pattern | Page Component Location | Role Accessibility | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `frontend/src/pages/Login.tsx` | Anonymous (Public) | Authenticates session credentials or handles new user registration. |
| `/forbidden` | `frontend/src/pages/Forbidden.tsx` | Authenticated | Displays fallback error when role requirements are unmet. |
| `/courses` | `frontend/src/modules/courses/pages/CourseCatalogPage.tsx` | Public / Guest | Central hub for course catalog searches, detail views, and enrollment triggers. |
| `/categories` | `frontend/src/modules/courses/pages/CategoryManagement.tsx` | Admin | Core portal for managing category taxonomies, colors, and icons. |
| `/wizard` | `frontend/src/modules/courses/components/CourseWizard/CourseWizardParent.tsx` | Admin, Teacher | Interactive multi-step course creation wizard. |
| `/student/dashboard` | `frontend/src/modules/assignments/pages/student/StudentDashboard.tsx` | Student | Holds list of active, overdue, and completed assignments. |
| `/student/batches` | `frontend/src/batch/StudentBatchEnrollmentPage.tsx` | Student | Allows students to browse and enroll in active batches. |
| `/student/attempt/:id` | `frontend/src/modules/assignments/pages/student/AssignmentAttempt.tsx` | Student | Dynamic assessment taker panel (timer-controlled). |
| `/student/result/:id` | `frontend/src/modules/assignments/pages/student/ResultPage.tsx` | Student | Displays grades, correct options, and teacher feedback. |
| `/teacher/dashboard` | `frontend/src/modules/assignments/pages/teacher/TeacherDashboard.tsx` | Admin, Teacher | Core analytics dashboard, assignment creator, and grading portal. |
| `/teacher/reports` | `frontend/src/modules/assignments/pages/teacher/TeacherReports.tsx` | Admin, Teacher | Visual performance charts, statistics, and cohort completions. |

---

## 7. Deep-Dive Security & Authentication Architecture

The application implements Spring Security on the backend with stateless JWT token tracking.

```
       Incoming HTTP Request
                 │
                 ▼
    ┌─────────────────────────┐
    │  JwtAuthenticationFilter│ <── Extracts Bearer Token
    └────────────┬────────────┘
                 │
                 ├─ Valid? ──> Load User from DB
                 │             Map role to ROLE_ADMIN / ROLE_TEACHER / ROLE_STUDENT
                 │             Set SecurityContextHolder Authentication
                 ▼
    ┌─────────────────────────┐
    │     SecurityConfig      │ <── Validates Route Access Rules
    └────────────┬────────────┘
                 │
                 ├─ Pass? ───> Proceed to REST Controller
                 └─ Fail? ───> Return 401 (Unauthorized) / 403 (Forbidden)
```

### 7.1 Security Filters and Configuration
1.  **CORS & CSRF Config:** CSRF is disabled (`Stateless session`). CORS is configured to allow credentials and support multi-origin environments.
2.  **Exception Interceptors:**
    *   **AuthenticationEntryPoint:** Unauthenticated attempts return a structured `401 Unauthorized` JSON.
    *   **AccessDeniedHandler:** Authenticated users trying to access unauthorized views (e.g., a student on the Admin dashboard) receive a `403 Forbidden` JSON response.
3.  **Role Mapping:** `JwtAuthenticationFilter` automatically prefixes user roles with `ROLE_` (e.g., `admin` is mapped to the Spring Authority `ROLE_ADMIN`).
4.  **AntMatchers Path Protections:**
    *   **Public Paths:** POST `/auth/login`, POST `/auth/register`, GET `/categories/**`, GET `/courses/**`.
    *   **Restricted Paths:** PUT `/admin/courses/*` and subpaths require `ADMIN` or `TEACHER` roles. `/admin/**` strictly requires the `ADMIN` role.
    *   **Catch-All Gate:** All other endpoints require authentication.

---

## 8. Frontend Engineering & Architecture

### 8.1 API Client Implementation (`apiClient.ts`)
The system utilizes a central Axios client configured with automatic request intercepts:
*   **Automatic Authorization Header Injection:** If a token is saved in LocalStorage, it is automatically appended to request headers as `Authorization: Bearer <token>`.
*   **Error Catch Interceptors:** Captures global HTTP failures and logs security lapses (redirecting to `/login` if authentication expires).

### 8.2 React Query Cache Management (`QueryProvider.tsx`)
API data fetching uses TanStack Query:
*   **Stale Time Tuning:** Configured to `1 minute` to reduce redundant network requests while keeping data fresh.
*   **Focus Refetch Controls:** `refetchOnWindowFocus` is disabled to prevent flickering during quick switching of window frames.
*   **Failed Request Retries:** Automatic retries on network failure are limited to `1` attempt to optimize performance.

### 8.3 Hybrid Mock-Production Failover Design
The client implements a transparent mock failover strategy controlled by the `VITE_USE_MOCK_API` environment variable. If the database is inaccessible, services automatically save data and state inside browser LocalStorage, allowing seamless previews even without a running database.

---

## 9. Implemented Features vs. Future Roadmap

### 9.1 Implemented Features
*   **Idempotent Database Seeder:** Pre-populates default admin, teacher, and student users along with rich multi-module courses.
*   **Interactive Multi-Type Assessment Engine:** Seamless workflow from design to submission and grading.
*   **Real-time Coding IDE Simulator:** Dynamic code execution sandbox within student quiz screens.
*   **Course Creator Wizard:** 4-step wizard for authoring courses, curriculum sections, and multimedia lessons.
*   **File Attachment System:** Local media upload fallback utilizing UUID naming conventions.

### 9.2 Missing / Planned Features
*   **Cryptographic JWT Signing:** Standard RS256/HS256 cryptographic signatures should replace the token stub model.
*   **Database Transaction Verification:** Missing robust JPA retry loops for heavy grading updates.
*   **Wysiwyg Markdown Editor Integration:** Rich formatting editor (e.g., MDX or ToastUI) to assist teachers in creating curriculum files.
*   **Docker Compose Configuration:** Simplify development orchestration by containerizing Spring Boot and PostgreSQL.

---

## 10. Design System & Visual Style Guide

### 10.1 Typography
*   **Display Headings:** **Space Grotesk** or **Outfit** for tech-forward accents, styled with `font-sans font-medium tracking-tight text-gray-900`.
*   **Body Text:** **Inter** (sans-serif) for general UI and text elements.
*   **Code Elements:** **JetBrains Mono** or **Fira Code** for testing panels, code blocks, and system stats.

### 10.2 Color Palette
The color scheme leverages deep enterprise plums, rich teals, and soft off-white canvas backgrounds:

| UI Aspect | Color Token / CSS Code | Purpose / Visual Experience |
| :--- | :--- | :--- |
| **Primary Brand Background** | `#510047` | Used on the primary Sidebar component to convey authority and enterprise stability. |
| **Accent Green/Teal** | `#01AC9F` | Primary button style, sign-in submit buttons, and positive completion metrics. |
| **Secondary Accent** | `#76f7e8` | Text highlight color, selected menu indicators, and branding accents. |
| **Bright Contrast Pink** | `#ffd7f0` | High-light labels, badges, and active state indicators. |
| **App Canvas Background** | `#faf0f5` (Login) / Soft Off-white | Eye-safe light theme utilizing subtle pastel hues. |
| **Border Accents** | `#f1e4ec` | Clean borders separating elements without visual clutter. |
