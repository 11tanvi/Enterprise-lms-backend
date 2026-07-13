# Xebia & EduCorp LMS — Complete Feature Index

This document provides a highly detailed comprehensive index of all implemented and planned features in the Xebia / EduCorp Learning Management System (LMS), mapping out their frontend components, backend architectures, endpoints, schema entities, workflows, and current status.

---

## 1. User Authentication, Registration & Session Management

### Purpose
Provides a secure gateway for students, teachers, and admins to log in or register new accounts, generating stateless JSON Web Tokens (JWT) for secure, role-based page routing and secure API endpoint access.

*   **Frontend Pages:**
    *   `/login` (`frontend/src/pages/Login.tsx`) - Integrated Login & Registration panel.
    *   `/forbidden` (`frontend/src/pages/Forbidden.tsx`) - Unauthorised action guard page.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.user.controller.AuthController`
*   **Services:**
    *   Frontend: `frontend/src/services/authService.ts`
    *   Backend: `com.geeknito.geeknito_backend.config.JwtService`
*   **Repositories:**
    *   `com.geeknito.geeknito_backend.user.repository.UserRepository`
*   **DTOs:**
    *   `AuthRequestDTO`, `AuthResponseDTO`, `RegisterRequestDTO` (defined inside `AuthController.java` or separate files)
*   **Entities:**
    *   `com.geeknito.geeknito_backend.entity.learning.UserEntity`
*   **API Endpoints:**
    *   `POST /auth/login` - Validates credentials, returns JWT.
    *   `POST /auth/register` - Creates a new user record in the database.
*   **React Components:**
    *   `Login.tsx` (Handles state switching between Sign In and Sign Up tabs, visual brand animations).
    *   `ProtectedRoute.tsx` (Route-level wrapper validating JWT presence and matching user roles).
*   **React Hooks:**
    *   Standard React `useState` for login forms.
*   **Navigation Flow:**
    *   Guest user enters URL ──> Routed to `/login` if unauthenticated ──> Sign In Successful ──> Redirected to appropriate dashboard based on role (`/courses` for Student or `/teacher/dashboard` for Teacher/Admin).
*   **Database Tables:**
    *   `users` (Columns: `id`, `email`, `password`, `full_name`, `role`, `is_active`, `created_at`, `updated_at`).
*   **Dependencies:**
    *   Frontend: `lucide-react` (icons), `motion` (tab sliding transitions), `apiClient` (Axios wrapper).
    *   Backend: Spring Security, `io.jsonwebtoken` (JWT library), BCrypt.
*   **Current Status:**
    *   **Implemented** (fully functional, with local client storage fallback when the server is in mock-mode).
*   **Known Limitations:**
    *   Client stores JWT token in `localStorage`, which is susceptible to XSS. Recommend migrating to HTTP-only secure cookies in high-security production environments.

---

## 2. Category Taxonomy Management

### Purpose
Allows Administrators to curate course tracks or categories with highly customized visual tags, helping organize a large catalog into distinct, recognizable visual learning paths.

*   **Frontend Pages:**
    *   `/categories` (`frontend/src/modules/courses/pages/CategoryManagement.tsx`) - Central table for editing taxonomies.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.category.controller.CategoryAdminController` (Write routes)
    *   `com.geeknito.geeknito_backend.category.controller.CategoryController` (Public read routes)
*   **Services:**
    *   Frontend: `frontend/src/services/categoryService.ts`
    *   Backend: `com.geeknito.geeknito_backend.category.service.CategoryService` (Interface & Impl)
*   **Repositories:**
    *   `com.geeknito.geeknito_backend.category.repository.CategoryRepository`
*   **DTOs:**
    *   `CategoryRequestDTO`, `CategoryResponseDTO`
*   **Entities:**
    *   `com.geeknito.geeknito_backend.entity.learning.CategoryEntity`
*   **API Endpoints:**
    *   `GET /api/categories` - Returns all categories.
    *   `POST /api/admin/categories` - Creates a category (Admin only).
    *   `PUT /api/admin/categories/{id}` - Updates a category (Admin only).
    *   `DELETE /api/admin/categories/{id}` - Deletes a category (Admin only).
*   **React Components:**
    *   `CategoryManagement.tsx` (Holds visual grids, icon selection prompts, and hex-color pickers).
*   **React Hooks:**
    *   TanStack React Query handles cached fetching of the list.
*   **Navigation Flow:**
    *   Admin Sidebar click ──> Navigates to `/categories` ──> Edits or creates a category ──> Instantly reflects as styling color accents in the Course Catalog.
*   **Database Tables:**
    *   `categories` (Columns: `id`, `name`, `slug`, `description`, `icon`, `color_code`, `created_at`, `updated_at`).
*   **Dependencies:**
    *   `lucide-react` for icons, React Query for UI state management.
*   **Current Status:**
    *   **Implemented** (complete with full support for customizing Unicode symbols and Tailwind-compatible color tokens).
*   **Known Limitations:**
    *   No automatic duplicate category slug check on the frontend before submitting.

---

## 3. Course Creator & Curriculum Wizard

### Purpose
Provides teachers and administrators with a multi-step workflow to draft comprehensive courses, structure hierarchical modules, and attach educational materials.

*   **Frontend Pages:**
    *   `/wizard` (`frontend/src/modules/courses/components/CourseWizard/CourseWizardParent.tsx`) - Step-by-step drafting layout.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.course.controller.CourseAdminController`
    *   `com.geeknito.geeknito_backend.course.controller.CurriculumAdminController`
    *   `com.geeknito.geeknito_backend.course.controller.ContentAdminController`
*   **Services:**
    *   Frontend: `frontend/src/services/courseService.ts`, `frontend/src/services/curriculumService.ts`, `frontend/src/services/contentService.ts`
    *   Backend: `CourseAdminService`, `CurriculumAdminService`, `ContentAdminService` (Interfaces & Impl)
*   **Repositories:**
    *   `CourseRepository`, `ModuleRepository`, `SubmoduleRepository`, `ContentRepository`
*   **DTOs:**
    *   `CourseRequestDTO`, `CourseResponseDTO`, `ModuleRequestDTO`, `ModuleResponseDTO`, `SubmoduleRequestDTO`, `SubmoduleResponseDTO`, `ContentRequestDTO`, `ContentResponseDTO`
*   **Entities:**
    *   `CourseEntity`, `ModuleEntity`, `SubmoduleEntity`, `ContentEntity`
*   **API Endpoints:**
    *   `POST /api/admin/courses` - Creates base metadata.
    *   `POST /api/admin/modules` - Creates syllabus sections.
    *   `POST /api/admin/submodules` - Creates individual lessons.
    *   `POST /api/admin/contents` - Attaches learning materials.
*   **React Components:**
    *   `CourseWizardParent.tsx` (Main layout tracking active wizard tab).
    *   `WizardStep1.tsx` (Base details & SEO slugs).
    *   `WizardStep2.tsx` (Syllabus tree authoring).
    *   `WizardStep3.tsx` (Content asset mapping).
    *   `WizardStep4.tsx` (Final preview & publication).
*   **React Hooks:**
    *   TanStack React Query mutations for saving incremental steps.
*   **Navigation Flow:**
    *   Admin Sidebar ──> `/wizard` ──> Step 1 Metadata ──> Step 2 Create Modules ──> Step 3 Drag-and-drop materials ──> Step 4 Publish ──> Newly created course appears on student catalogs.
*   **Database Tables:**
    *   `courses`, `modules`, `submodules`, `contents`.
*   **Dependencies:**
    *   `motion/react` for slide transitions between wizard steps.
*   **Current Status:**
    *   **Implemented** (highly polished, supports drag-and-drop structures and rich metadata parsing).
*   **Known Limitations:**
    *   Does not currently feature a rich text WYSIWYG editor for Markdown fields inside the wizard; inputs are written as raw plain text.

---

## 4. Course Catalog & Student Discovery

### Purpose
Enables students to discover available courses, view structural module breakdowns, read lesson content, and enroll in target courses or active batches.

*   **Frontend Pages:**
    *   `/courses` (`frontend/src/modules/courses/pages/CourseCatalogPage.tsx`) - Discovery grid.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.course.controller.CourseCatalogController`
    *   `com.geeknito.geeknito_backend.course.controller.EnrollmentController`
*   **Services:**
    *   Frontend: `frontend/src/services/courseService.ts`, `frontend/src/services/enrollmentService.ts`
    *   Backend: `CourseCatalogService`, `EnrollmentService`
*   **Repositories:**
    *   `CourseRepository`, `EnrollmentRepository`
*   **DTOs:**
    *   `CourseCatalogCardDTO`, `CourseCatalogDetailDTO`, `EnrollmentRequestDTO`, `EnrollmentResponseDTO`
*   **Entities:**
    *   `CourseEntity`, `EnrollmentEntity`
*   **API Endpoints:**
    *   `GET /api/catalog` - Returns all published courses.
    *   `GET /api/catalog/{id}` - Detailed course details with full syllabus tree.
    *   `POST /api/enrollments` - Enroll student in course.
*   **React Components:**
    *   `CourseCatalog.tsx` (Filter and search engine).
    *   `CourseCard.tsx` (Visual display card with dynamic category color highlights).
    *   `CourseDetailView.tsx` (Accordion module outline, enroll trigger).
    *   `CourseCatalogView.tsx` (Syllabus viewing drawer).
*   **React Hooks:**
    *   `useQuery` for catalog listings.
*   **Navigation Flow:**
    *   Student Sidebar ──> `/courses` ──> Clicks Course Card ──> Details Modal ──> Clicks "Enroll" ──> Unlocks curriculum lessons and cohort selections.
*   **Database Tables:**
    *   `courses`, `enrollments`.
*   **Dependencies:**
    *   `lucide-react` for iconography.
*   **Current Status:**
    *   **Implemented** (complete responsive layout with instant client-side searches and interactive learning drawers).
*   **Known Limitations:**
    *   Course catalog does not support server-side pagination yet (loads all published courses at once).

---

## 5. Cohort & Batches Module

### Purpose
Allows administrators and teachers to group students into learning batches (classes) mapped to courses, enabling scheduling and isolated evaluation environments.

*   **Frontend Pages:**
    *   `/student/batches` - Portal where enrolled students join cohorts.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.batch.controller.BatchController`
    *   `com.geeknito.geeknito_backend.course.controller.StudentBatchEnrollmentController`
*   **Services:**
    *   Frontend: `frontend/src/services/enrollmentService.ts` (Batch mapping APIs)
    *   Backend: `com.geeknito.geeknito_backend.batch.service.BatchService`
*   **Repositories:**
    *   `BatchRepository`, `BatchStudentRepository`
*   **DTOs:**
    *   `BatchCreateRequestDTO`, `BatchResponseDTO`, `BatchStudentResponseDTO`
*   **Entities:**
    *   `BatchEntity`, `BatchStudentEntity`
*   **API Endpoints:**
    *   `GET /api/batches` - Retrieves cohorts.
    *   `POST /api/batches` - Initiates a new cohort.
    *   `POST /api/batches/{id}/enroll` - Maps a student to a batch.
*   **React Components:**
    *   `BatchEnrollmentModal.tsx` (Renders inside Course catalog to assign students).
*   **React Hooks:**
    *   Queries for loading batch details.
*   **Navigation Flow:**
    *   Student enrolls in a Course ──> Browses active cohorts ──> Selects a Batch with compatible dates ──> Enrolls.
*   **Database Tables:**
    *   `batches` (Columns: `id`, `course_id`, `name`, `start_date`, `end_date`, `status`, `max_students`), `batch_students`.
*   **Dependencies:**
    *   React Query.
*   **Current Status:**
    *   **Implemented** (relational mapping tables and enrollment flows exist).
*   **Known Limitations:**
    *   Batch views are somewhat integrated inside the Course catalog page; there is no full separate tabular management page for batches on the Administrator's side.

---

## 6. Online Assessment / Assignment Engine

### Purpose
Gives students a timed interface to complete multi-question assignments assigned to their cohort, tracking active durations, warning of focus losses, and saving draft responses.

*   **Frontend Pages:**
    *   `/student/dashboard` (`StudentDashboard.tsx`) - To-Do and Overdue assignment tracker.
    *   `/student/attempt/:id` (`AssignmentAttempt.tsx`) - Interactive exam view.
    *   `/student/result/:id` (`ResultPage.tsx`) - Grades and auto-grading summaries.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.assignment.controller.AssignmentController`
    *   `com.geeknito.geeknito_backend.assignment.controller.SubmissionController`
*   **Services:**
    *   Frontend: `frontend/src/modules/assignments/api/assignmentService.ts`
    *   Backend: `AssignmentService`, `SubmissionService`
*   **Repositories:**
    *   `AssignmentRepository`, `SubmissionRepository`, `StudentAnswerRepository`
*   **DTOs:**
    *   `AssignmentResponseDTO`, `SubmissionCreateRequestDTO`, `SubmissionResponseDTO`, `StudentAnswerCreateRequestDTO`
*   **Entities:**
    *   `AssignmentEntity`, `SubmissionEntity`, `StudentAnswerEntity`
*   **API Endpoints:**
    *   `GET /api/assignments/student` - List of active assignments.
    *   `GET /api/assignments/{id}` - Details of a single quiz structure.
    *   `POST /api/submissions` - Submit answers for grading.
*   **React Components:**
    *   `AssignmentCard.tsx` (Deadlines, status highlights).
    *   `QuestionNavigator.tsx` (Grid to jump between quiz questions).
    *   `Timer.tsx` (Countdown clock that auto-submits on expiration).
*   **React Hooks:**
    *   `useStudentAssignments` (Custom React Query hook loading context).
*   **Navigation Flow:**
    *   Student enters dashboard ──> Clicks "Start Assignment" ──> Warned about rules ──> Exam loaded (Timer active) ──> Student selects/inputs answers ──> Clicks "Submit" ──> Instantly redirected to performance report page.
*   **Database Tables:**
    *   `assignments`, `submissions`, `student_answers`.
*   **Dependencies:**
    *   `lucide-react` (clock, alert-triangle indicators), React Query.
*   **Current Status:**
    *   **Implemented** (complete, featuring local draft autosave to localStorage, timed submission, and an visual navigation grid).
*   **Known Limitations:**
    *   The anti-cheating browser focus loss detection is present on the UI but does not yet trigger a database-level strike/disqualification.

---

## 7. Interactive Coding Simulator

### Purpose
Implements an interactive coding environment inside the quiz interface, allowing students to select programming languages, write code with syntax highlights, and execute verification test cases.

*   **Frontend Pages:**
    *   Integrated into `/student/attempt/:id` (`AssignmentAttempt.tsx`) for CODING-type questions.
*   **Backend Controllers:**
    *   None (Simulation executes on the client-side).
*   **Services:**
    *   None.
*   **Repositories:**
    *   None.
*   **DTOs:**
    *   Question models map `codingLanguages`, `starterCode`, and `testCases` arrays within standard `QuestionResponseDTO` structures.
*   **Entities:**
    *   `com.geeknito.geeknito_backend.entity.learning.QuestionEntity` (with text blocks holding JSON structures for compilers).
*   **API Endpoints:**
    *   `GET /api/assignments/{id}` - Loads coding questions.
*   **React Components:**
    *   Coding question block inside `AssignmentAttempt.tsx` (Language dropdown selectors, Code textarea with syntax highlights, Run Test Cases trigger, status output boxes).
*   **React Hooks:**
    *   Local reactive states mapping compilation states and code variables.
*   **Navigation Flow:**
    *   Student navigates to coding question ──> Selects language (e.g., Python, JS) ──> Starter code is loaded ──> Writes code ──> Clicks "Run Test Cases" ──> Outputs simulation results (Success/Fail metrics) ──> Clicks save.
*   **Database Tables:**
    *   `questions`.
*   **Dependencies:**
    *   Frontend: standard text editors styled with CSS rules and fallback language presets.
*   **Current Status:**
    *   **Implemented** (dynamic, visually distinct environment, simulates output execution in local tests with feedback).
*   **Known Limitations:**
    *   Since test case execution runs inside a client-side sandbox simulator, it evaluates syntax matches rather than executing the code inside a secure backend container (which is standard practice to prevent security risks).

---

## 8. Grading, Reporting & Performance Analytics

### Purpose
Enables Teachers and Admins to review student assignment submissions, perform manual grading for essays or code, input custom qualitative feedback, and view cohort analytics.

*   **Frontend Pages:**
    *   `/teacher/dashboard` (`TeacherDashboard.tsx`) - Active analytics overview and grading portal.
    *   `/teacher/reports` (`ReportsAnalytics.tsx`) - Visualized performance charts.
*   **Backend Controllers:**
    *   `com.geeknito.geeknito_backend.assignment.controller.SubmissionController` (Grading endpoints)
*   **Services:**
    *   Frontend: `frontend/src/modules/assignments/api/assignmentService.ts`
    *   Backend: `SubmissionService`
*   **Repositories:**
    *   `SubmissionRepository`, `StudentAnswerRepository`
*   **DTOs:**
    *   `SubmissionSummaryResponseDTO`, `SubmissionUpdateRequestDTO`
*   **Entities:**
    *   `SubmissionEntity`, `StudentAnswerEntity`
*   **API Endpoints:**
    *   `GET /api/submissions/teacher` - Retrieves submissions awaiting evaluation.
    *   `PUT /api/submissions/{id}/grade` - Updates score and teacher feedback.
*   **React Components:**
    *   Grading panel within `TeacherDashboard.tsx` (Student answer comparisons, score inputs, feedback fields).
    *   Charts components inside `ReportsAnalytics.tsx` (Using `recharts` for progress tracking).
*   **React Hooks:**
    *   React Query mutations for committing grades.
*   **Navigation Flow:**
    *   Teacher enters Dashboard ──> Selects "Grading" tab ──> Displays submissions awaiting grading ──> Clicks "Review" ──> Views correct vs student answers ──> Inputs custom scores ──> Clicks "Submit Grade" ──> Student dashboard updates instantly.
*   **Database Tables:**
    *   `submissions`, `student_answers`.
*   **Dependencies:**
    *   `recharts` for performance curves.
*   **Current Status:**
    *   **Implemented** (complete with full support for auto-marking MCQs, manual scoring for open-ended text fields, and score override states).
*   **Known Limitations:**
    *   No bulk grading exports (e.g., download cohort grades as CSV).
