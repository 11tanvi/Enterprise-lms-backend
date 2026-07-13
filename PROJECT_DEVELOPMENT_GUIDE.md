# Xebia & EduCorp LMS — Technical & Project Development Guide

This document serves as the official permanent development guide for the Learning Management System (LMS) codebase. It defines architectural rules, UI design standards, backend/frontend engineering patterns, and integration workflows to ensure long-term maintainability, security, and visual consistency.

---

## 1. Folder Structure Rules

To maintain modularity and prevent file bloat (especially in central files like `App.tsx`), the codebase is organized strictly into logical feature spaces. All new developments must adhere to these placement rules:

### 1.1 Frontend Layout & Placement Rules

*   **New Feature Modules:**
    Must be created inside `/frontend/src/modules/<module-name>`.
    Each module must have a self-contained structure:
    ```
    /frontend/src/modules/<module-name>
    ├── api/           # Service calls and hooks interfacing with backend REST APIs
    ├── hooks/         # Feature-specific custom React Query hooks
    ├── components/    # Local layout blocks and visual helpers
    ├── pages/         # Full-view components mapped directly to router paths
    ├── shared/        # Reusable module-level elements (e.g., specialized cards, charts)
    └── types/         # Local TypeScript interfaces and enums
    ```
*   **APIs & REST Integrations:**
    *   Global or cross-module services belong in `/frontend/src/services/` (e.g., `authService.ts`, `courseService.ts`).
    *   Module-specific services belong in the module's own `api/` folder (e.g., `assignmentService.ts`).
*   **Hooks:**
    *   Hooks managing network queries must live in the module's `hooks/` directory (e.g., `useStudentAssignments.ts`) or inside the global services layer.
*   **Shared Components:**
    *   Global visual components (Header, Sidebar, ProtectedRoute, Toast) must live in `/frontend/src/components/`.
    *   Do not put specialized feature-specific components into the global directory. Keep them within their respective modules.
*   **Layouts:**
    *   Core layouts are managed inside `/frontend/src/App.tsx` using responsive Grid/Flex classes wrapped around `<Sidebar />` and `<Header />`.
*   **Naming Conventions:**
    *   **Directories:** Always use lowercase, kebab-case (e.g., `assignments`, `courses`).
    *   **React Components:** PascalCase (e.g., `CourseCard.tsx`, `CreateAssignmentWizard.tsx`).
    *   **Hooks:** camelCase, starting with `use` (e.g., `useStudentAssignments.ts`).
    *   **Services/APIs:** camelCase, suffixed with `Service` (e.g., `categoryService.ts`).

### 1.2 Backend Package Layout & Placement Rules

The Spring Boot backend is organized using a feature-per-package architecture:

```
/backend/src/main/java/com/geeknito/geeknito_backend
├── config/                 # Stateless security, JWT filters, CORS, and Seeder
├── entity/learning/        # Shared JPA database entities mapped to SQL tables
├── exception/              # Global REST error mappings and exception definitions
├── <feature-module>/       # Feature namespace (e.g., course, category, batch, assignment)
│   ├── controller/         # REST Controllers exposes API routes
│   ├── dto/                # Request/Response data transfer objects
│   ├── repository/         # Spring Data JPA Repository interfaces
│   └── service/            # Core business logic (Interface & Impl)
```

---

## 2. UI Design & Styling Rules

The application uses **Tailwind CSS** with a custom executive brand palette. The layout must feel professional, spacious, and consistent.

### 2.1 Core Executive Color Palette
The CSS colors are imported in `/frontend/src/index.css` and configured based on the following specific tokens:

*   **Primary Corporate Purple:** `#510047` (Applied on the central sidebar, navigation links, and primary brand indicators).
*   **Secondary Teal Accent:** `#01AC9F` (Applied on primary submission buttons, catalog search, and status checkpoints).
*   **Bright Mint Highlight:** `#76f7e8` (Applied as border focus rings and high-visibility menu selectors).
*   **Highlight Pink Background:** `#ffd7f0` (Applied as high-contrast notification badges or light alert fields).
*   **Canvas Color:** `#faf0f5` / Pure White (Utilizes soft eye-safe off-white backdrops to increase negative space).
*   **Neutral Grays:** Standard slate series (`bg-slate-50`, `text-slate-700`, `border-slate-100`).

### 2.2 Typography Pairings
*   **Display Headings:** "Space Grotesk" or "Outfit" (`font-sans font-semibold tracking-tight text-slate-900`) for headers, modals, and landing sections.
*   **Body & Descriptions:** "Inter" (`font-sans text-slate-600 leading-relaxed`) for descriptive paragraphs, labels, and forms.
*   **Code & Metrics:** "JetBrains Mono" or "Fira Code" (`font-mono text-xs`) for scores, test cases, timers, and coding blocks.

### 2.3 Visual Building Blocks

*   **Border Radius:**
    *   Cards & Small Elements: `rounded-xl` or `rounded-lg`.
    *   Outer Blocks & Modals: `rounded-2xl` for professional, modern aesthetics.
    *   Badges & Toggles: `rounded-full` for high contrast.
*   **Shadow System:**
    *   Cards: Low shadow `shadow-sm` or `shadow-md` with smooth hover transition (`transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`).
    *   Modals & Drawers: Strong drop shadows (`shadow-2xl`) with matching semi-transparent backdrops.
*   **Buttons:**
    *   **Primary:** Solid color (`bg-[#510047]` or `bg-[#01AC9F]`), white text, bold tracking, `hover:opacity-90 transition-all focus:ring-2 focus:ring-offset-2`.
    *   **Secondary:** Outlined `border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors`.
*   **Cards:**
    *   White background, thin border (`border border-slate-100`), padding `p-6` or `p-8`. Never group content too tightly.
*   **Tables:**
    *   Clean list format or borders. Tabular column headers must be uppercase, gray text, tiny sizing (`text-xs font-semibold tracking-wider text-slate-500 uppercase bg-slate-50`).
*   **Form Inputs:**
    *   Borders `border-slate-200`, soft gray labels `text-slate-700`, active focus states using brand accents `focus:border-[#510047] focus:ring-[#510047]/10`.
*   **Modals:**
    *   Fixed centering `fixed inset-0 z-50 flex items-center justify-center p-4`, overlaid on a dark blurred backdrop `bg-slate-900/40 backdrop-blur-sm`.
*   **Sidebar Navigation:**
    *   Deep background `bg-[#510047]`, thin border partitioning, white icons with custom hover states, and bright mint indicator bars on active selections.
*   **Header Navbar:**
    *   Clean white canvas, sticky top positioning `sticky top-0 z-40`, bottom slate separator `border-b border-slate-100`, holding brand logs, query searchbars, and profile roles.
*   **Spacing Rhythm:**
    *   Avoid identical margin grids. Keep outer layouts spacious (`p-8` or `p-10`), list spacing clear (`space-y-4` or `space-y-6`), and section bounds distinct.
*   **Icons:**
    *   Strictly import from `lucide-react`. Raw inline SVGs are forbidden to prevent stylesheet inconsistencies.
*   **Empty States:**
    *   Must feature a dedicated Lucide icon (colored gray/brand), a descriptive headline, an instructional paragraph, and an optional button to trigger creation.
*   **Loading States:**
    *   Use animated skeleton components matching the layout of the loaded card (`animate-pulse bg-slate-100 rounded-lg`). Spinner indicators must rotate cleanly using brand colors.
*   **Error States:**
    *   Display full visual context: an error icon, a concise explanation of what failed, and an obvious "Retry" or "Go Back" action button.

---

## 3. React Development Rules

To prevent rendering loops and preserve code clean-lines, all components must adhere to the following React rules:

### 3.1 React Query (TanStack Query) Guidelines
*   **Setup:** Instantiated inside `QueryProvider.tsx`.
*   **Stale Time:** Configured globally to `60000ms` (1 minute) to avoid redundant duplicate back-to-back fetching.
*   **Refetch Rules:** `refetchOnWindowFocus` must be disabled in normal development to prevent view stuttering on iframe focus shifts.
*   **Query Keys:** Must be structured consistently as arrays (e.g., `['courses']`, `['assignments', role]`, `['submissions', submissionId]`).
*   **Prefetching & Mutations:** Invalidate queries using the QueryClient on mutations to keep server and UI states synchronized:
    ```typescript
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    ```

### 3.2 Custom Hooks Pattern
*   All data fetches and state transformations must be isolated into custom hooks (e.g., `useStudentAssignments.ts`).
*   Keep the UI rendering files clean of API-parsing operations.

### 3.3 Component Splitting Constraints
*   Do **NOT** write monolithic single-file views.
*   If a page has complex wizard states (like `CourseWizardParent`), split sub-steps and localized panels into their own files (e.g., `WizardStep1.tsx`, `WizardStep2.tsx`).
*   Extract large static data catalogs or forms into secondary modules to avoid bundle bloat.

### 3.4 Props & Typing Standards
*   All props must be explicitly typed using TypeScript interfaces.
*   Strictly avoid using `any` types.
*   Interfaces must match backend responses exactly.

### 3.5 Local and Global State Separation
*   **Global State:** Managed strictly inside `/frontend/src/context/AppContext.tsx` (User details, authentication status, active role selection, drawer collapsible states, and toast queues).
*   **Local State:** UI controls, edit modes, and active step selections must remain encapsulated in React `useState`.

### 3.6 Error Handling
*   Wrap local UI code within React Error Boundaries.
*   Ensure service API calls fail gracefully by triggering toasts via `addToast` (`type: 'error'`).

---

## 4. Backend (Spring Boot) Rules

The backend architecture is structured around standard enterprise Spring Boot layers.

### 4.1 Class Naming Conventions

| Layer type | Suffix / Pattern | Example |
| :--- | :--- | :--- |
| **REST Controllers** | `*Controller` or `*AdminController` | `CourseAdminController`, `CategoryController` |
| **Service Interfaces** | `*Service` | `EnrollmentService` |
| **Service Implementation** | `*ServiceImpl` | `EnrollmentServiceImpl` |
| **Repositories** | `*Repository` | `StudentAnswerRepository` |
| **Entities** | `*Entity` | `SubmissionEntity` |
| **Request DTOs** | `*RequestDTO` or `*CreateRequestDTO` | `AssignmentCreateRequestDTO` |
| **Response DTOs** | `*ResponseDTO` | `CourseResponseDTO` |

### 4.2 Entity Relationships & JPA Rules
*   **Entity Annotations:** All learning-domain database structures must be defined inside `/backend/src/main/java/com/geeknito/geeknito_backend/entity/learning`.
*   **Cascade Management:** Use appropriate cascade structures (`CascadeType.ALL`, `orphanRemoval = true`) to prevent database orphans. For example, deleting a course must cleanly cascade delete all associated modules, submodules, and lesson content:
    ```java
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleEntity> modules;
    ```
*   **Enums:** Always map enums using string representations in the database to prevent indices misalignment on additions:
    ```java
    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;
    ```

### 4.3 Transaction Rules
*   Service layer implementation methods modifying database states (saves, updates, deletes) must be annotated with Spring's `@Transactional` to guarantee atomicity and rollback on errors.

---

## 5. API Integration & REST Client Rules

### 5.1 Communication Gateway (Never Hardcode URLs)
*   **No Hardcoding:** Base endpoints must never be defined inline in components.
*   **apiClient:** All HTTP communication must go through `apiClient.ts`.
*   **Bearer Auth Token Injection:** `apiClient` includes an interceptor that automatically reads the local storage token and appends the auth header:
    ```typescript
    config.headers.Authorization = `Bearer ${token}`;
    ```

### 5.2 Safe-Parsing & Null Fallbacks
*   **Array Safeguards:** Always handle empty arrays gracefully when mapping list models: `(courses || []).map(...)`.
*   **Null Checks:** Always verify nested data objects before rendering to prevent client-side "undefined" execution halts:
    ```typescript
    const duration = course?.durationMinutes ?? 0;
    ```
*   **Loading Boundaries:** Every REST query must exhibit a placeholder loading screen while `isLoading` evaluates to true.
*   **Unauthorized Routing:** Interceptors must catch HTTP `401` errors, clear expired local cache states, and redirect the browser back to the `/login` portal.

---

## 6. Coding Standards & Typings

### 6.1 TypeScript Typing Rules
*   **Named Exports Only:** Avoid default exports for files under `types/`. Use standard named module exports.
*   **Standard Enums:** Always declare explicit standard enums rather than runtime `const enums` to ensure compatibility with modern bundlers:
    ```typescript
    export enum UserRole {
      ADMIN = 'admin',
      TEACHER = 'teacher',
      STUDENT = 'student'
    }
    ```

### 6.2 Java Architectural Standards
*   Follow standard Spring Boot style guidelines.
*   Variables and method names must use camelCase; Classes and Interfaces PascalCase; Constants UPPER_SNAKE_CASE.
*   Ensure API payloads use proper HTTP response status mappings (e.g., `201 Created` for saves, `204 No Content` for updates/deletes, `404 Not Found` for missing resources).

---

## 7. Batch Module Standards

*   **Definition:** Cohorts (Batches) represent learning semesters/groups assigned to particular courses.
*   **Date Safety:** Batches must always validate temporal constraints (`startDate` must occur before `endDate`).
*   **Mappings:** Managed through `BatchStudentEntity` which bridges specific user accounts to academic cohorts.
*   **Course Assignment:** Each batch contains a single parent course pointer.

---

## 8. Assignment Module Standards

*   **Assessment Creation:** Controlled by the `CreateAssignmentWizard` on the teacher/admin dashboards.
*   **Question Types:** Supported formats must map to `QuestionType` definitions:
    *   `MCQ` (Multiple Choice Questions with options mapped in `QuestionOptionEntity`)
    *   `SHORT_ANSWER` (Text field matching)
    *   `ESSAY` (Paragraph evaluation)
    *   `FILE_UPLOAD` (Submission upload fallback)
    *   `CODING` (Integrated coding interface)
*   **Coding Challenge Specs:** Includes initial template code fields, targeted programming languages, and matching unit test declarations.
*   **Assessment Attempt Timer:** Students launching a quiz must view a high-contrast timer matching assignment bounds (`durationMinutes`).

---

## 9. Course & Curriculum Module Standards

*   **Visual Categories:** The taxonomy selector map must allow matching icon representations (Unicode/Lucide) and custom highlight colors to categories.
*   **Curriculum Structure:** Structure follows the standard cascading order:
    `Course (metadata) -> Modules -> Submodules (Lessons) -> Content Records`
*   **Content Types:** Supported content records include `MARKDOWN`, `VIDEO_LINK`, `HTML_EMBED`, and `FILE_UPLOAD`.

---

## 10. Future Module Standards

Any future feature modules (e.g., Forum, Notifications, Certifications) must be built using the exact architectural rules outlined in this document:
1.  Add new database tables through Flyway SQL migration versions (`V7__...sql` etc.).
2.  Define backend entities under `entity/learning/` with proper relationship annotations.
3.  Establish new subpackages inside `com.geeknito.geeknito_backend` with decoupled controllers, repositories, and transactional services.
4.  Generate modular frontend directories inside `/frontend/src/modules/` ensuring zero direct dependency on other distinct modules.
5.  Wrap any newly introduced routes within the secure `<ProtectedRoute>` filter validating authorized role access before rendering.
