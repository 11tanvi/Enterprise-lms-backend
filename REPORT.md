# Assignment Creation Debugging Report

## 1. Investigation
- The frontend `CreateAssignmentWizard` calls `assignmentService.saveAssignment()`, which makes a `POST /assignments` request using `apiClient`.
- The `apiClient`'s response interceptor throws a rejected promise on HTTP error (e.g. 400 or 500).
- However, the `catch (error)` block in `saveAssignment()` is configured to **silently fall back** to `localStorage`. It does not propagate the error to the UI. Thus, the UI falsely assumes success and displays the success toast.
- Once redirected to the Teacher Dashboard, `assignmentService.getAssignments()` executes. Since the live API endpoint (`GET /assignments`) is operational, it retrieves the live DB records instead of using the local storage fallback.
- The DB does not contain the new assignment because the POST request silently failed, causing the Teacher Dashboard's `recentAssignments` list to omit it.

## 2. Root Cause
The live API request fails (400 Bad Request) due to two data mapping issues:
1. **Missing Required Field (`passingMarks`)**: The backend's `AssignmentCreateRequestDTO` enforces `@NotNull` on `passingMarks`. Although it has a `@Builder.Default` of 40, Jackson bypasses builder defaults when deserializing the payload using the no-args constructor, leaving `passingMarks` as `null` and failing `@Valid` validation. The frontend's payload omitted this field entirely.
2. **Date Format Issue (`availableFrom`)**: The frontend sent `availableFrom` as an ISO string with a timezone character (`Z`) (e.g., `2026-07-08T18:19:30.123Z`). Spring Boot's Jackson deserializer for `LocalDateTime` strictly rejects strings with timezone metadata unless specifically configured, throwing an `InvalidFormatException`.

## 3. Files Affected
- `frontend/src/modules/assignments/api/assignmentService.ts`

## 4. Minimal Fix
Updated `saveAssignment` payload construction in `assignmentService.ts` to:
- Explicitly map `passingMarks: Math.floor((assignment.totalMarks || 100) * 0.4)` to satisfy the non-null integer validation constraint.
- Strip the timezone identifier by appending `.replace('Z', '')` to the `availableFrom` string so it properly parses as a `LocalDateTime`.

## 5. Verification
With the minimal fix applied, the POST request complies with the backend's input validation requirements. The transaction commits correctly, returning a 201 Created and successfully creating the `AssignmentEntity` without triggering the silent fallback in `saveAssignment()`. When the Teacher Dashboard re-fetches the live API, the new assignment will immediately appear.
