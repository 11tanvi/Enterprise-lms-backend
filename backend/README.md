# Enterprise LMS API Testing Master Guide

## Overview

This guide provides step-by-step instructions for manually testing the Enterprise LMS Admin CRUD APIs using Postman.

### Technology Stack
- Spring Boot
- Clean Architecture (Controller → Service → Repository)
- DTO-based Request/Response Handling
- Validation-driven API Design
- Soft Delete Strategy

---

# Prerequisites

## Base URL

```http
http://localhost:8080/api/v1
```

## Required Headers

For all POST and PUT requests:

```http
Content-Type: application/json
```

## Dynamic IDs

Replace the following placeholders with actual IDs returned from previous API responses:

```text
{id}
{courseId}
{moduleId}
{submoduleId}
{contentId}
```

---

# Recommended End-to-End Execution Flow

1. Create Category
2. Create Course
3. Create Module
4. Create Submodule
5. Create Content
6. Retrieve Full Curriculum Tree

---

# 1. Category Administration

## Base Path

```http
/categories
```

## Available Endpoints

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/categories` | Create Category |
| GET | `/categories` | Get All Categories |
| GET | `/categories/{id}` | Get Category By ID |
| PUT | `/categories/{id}` | Update Category |
| DELETE | `/categories/{id}` | Soft Delete Category |

---

## Create Category

### Endpoint

```http
POST /categories
```

### Request Body

```json
{
  "name": "Software Engineering",
  "icon": "code-braces",
  "description": "Enterprise-grade software patterns, architectures, and development practices.",
  "color": "#0284C7"
}
```

---

## Update Category

### Endpoint

```http
PUT /categories/{id}
```

### Request Body

```json
{
  "name": "Advanced Software Architecture",
  "icon": "cpu-chip",
  "description": "Mastering system designs, microservices, and high-throughput databases.",
  "color": "#4F46E5"
}
```

---

# 2. Course Administration

## Base Path

```http
/admin/courses
```

## Available Endpoints

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/admin/courses` | Create Course |
| GET | `/admin/courses` | Get All Courses |
| GET | `/admin/courses/{id}` | Get Course By ID |
| PUT | `/admin/courses/{id}` | Update Course |
| DELETE | `/admin/courses/{id}` | Soft Delete Course |

---

## Create Course

Use the Category ID generated from Step 1.

### Endpoint

```http
POST /admin/courses
```

### Request Body

```json
{
  "title": "Mastering Spring Boot & Microservices",
  "slug": "mastering-spring-boot-and-microservices",
  "shortDescription": "Learn full-stack Enterprise-ready cloud applications from scratch.",
  "description": "An exhaustive, E2E program covering Spring Boot, Hibernate, PostgreSQL, Docker, and distributed transaction architectures.",
  "level": "Advanced",
  "duration": "40 hours",
  "thumbnailUrl": "https://cdn.geeknito.com/thumbnails/spring-boot-course.png",
  "categoryId": 1
}
```

---

## Update Course

### Endpoint

```http
PUT /admin/courses/{id}
```

### Request Body

```json
{
  "title": "Mastering Spring Boot 3.x & Cloud Architecture",
  "slug": "mastering-spring-boot-3-and-cloud",
  "shortDescription": "Build, deploy, and scale enterprise Java microservices.",
  "description": "Fully updated for Spring Boot 3.x, GraalVM native-images, Spring Security OAuth2, and Kubernetes deployments.",
  "level": "Expert",
  "duration": "48 hours",
  "thumbnailUrl": "https://cdn.geeknito.com/thumbnails/spring-boot-v3-course.png",
  "categoryId": 1
}
```

---

# 3. Curriculum Administration

## Base Path

```http
/admin/courses/{courseId}/modules
```

## Available Endpoints

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/admin/courses/{courseId}/modules` | Create Module |
| POST | `/admin/courses/{courseId}/modules/{moduleId}/submodules` | Create Submodule |
| GET | `/admin/courses/{courseId}/modules` | Retrieve Curriculum Tree |

---

## Create Module

### Endpoint

```http
POST /admin/courses/{courseId}/modules
```

### Request Body

```json
{
  "title": "Getting Started with Spring Boot Core",
  "description": "Dive deep into Spring Framework fundamentals, dependency injection, and bean scopes.",
  "moduleOrder": 1
}
```

---

## Create Submodule

### Endpoint

```http
POST /admin/courses/{courseId}/modules/{moduleId}/submodules
```

### Request Body

```json
{
  "title": "Understanding the Dependency Injection Engine",
  "description": "How the ApplicationContext parses configuration and instantiates beans.",
  "slug": "understanding-dependency-injection-engine",
  "submoduleOrder": 1
}
```

---

# 4. Content Administration

## Base Path

```http
/admin/submodules/{submoduleId}/contents
```

## Available Endpoints

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | `/admin/submodules/{submoduleId}/contents` | Create Content |
| GET | `/admin/submodules/{submoduleId}/contents` | Get All Content |
| PUT | `/admin/submodules/{submoduleId}/contents/{contentId}` | Update Content |
| DELETE | `/admin/submodules/{submoduleId}/contents/{contentId}` | Soft Delete Content |

---

## Create Code Content

### Endpoint

```http
POST /admin/submodules/{submoduleId}/contents
```

### Request Body

```json
{
  "title": "Wiring Beans using Java Config",
  "type": "code",
  "text": "The following is a standard demonstration of initializing an ApplicationContext using AnnotationConfig.",
  "code": "@Configuration\npublic class AppConfig {\n @Bean\n public OrderService orderService() {\n return new OrderServiceImpl();\n }\n}",
  "language": "java",
  "contentOrder": 1
}
```

---

## Create Video Content

### Endpoint

```http
POST /admin/submodules/{submoduleId}/contents
```

### Request Body

```json
{
  "title": "E2E Dependency Injection Tutorial",
  "type": "video",
  "videoUrl": "https://player.vimeo.com/video/987654321",
  "caption": "Video tutorial demonstrating constructor vs field injection.",
  "contentOrder": 2
}
```

---

## Update Content

### Endpoint

```http
PUT /admin/submodules/{submoduleId}/contents/{contentId}
```

### Request Body

```json
{
  "title": "E2E Bean Injection Tutorial (Updated Edition)",
  "type": "video",
  "videoUrl": "https://player.vimeo.com/video/987654321-updated",
  "caption": "Fully updated walkthrough outlining best injection design patterns.",
  "contentOrder": 2
}
```

---

# Validation Scenarios

## Category Validation

### Fresh Database Check

```http
GET /categories
```

Expected Response:

```json
[]
```

### Create Category

```http
POST /categories
```

Expected Response:

```json
{
  "id": 1
}
```

---

## Entity Reference Validation

Create a course using a non-existing category:

```json
{
  "categoryId": 999999
}
```

Expected Result:

```text
404 Not Found
Category not found with ID: 999999
```

---

## Curriculum Tree Validation

After creating Categories, Courses, Modules, Submodules, and Content:

```http
GET /admin/courses/{courseId}/modules
```

Expected Result:

- Modules sorted by moduleOrder
- Nested submodules sorted by submoduleOrder
- Full curriculum hierarchy returned

---

## Soft Delete Verification

Delete a Course:

```http
DELETE /admin/courses/{id}
```

Then retrieve it:

```http
GET /admin/courses/{id}
```

Expected Response:

```json
{
  "isActive": false,
  "isPublished": false
}
```

The record remains in the database but is marked inactive, demonstrating Soft Delete behavior.

---

# Testing Checklist

- [ ] Category CRUD
- [ ] Course CRUD
- [ ] Module Creation
- [ ] Submodule Creation
- [ ] Content Creation (Code)
- [ ] Content Creation (Video)
- [ ] Content Update
- [ ] Soft Delete Validation
- [ ] Curriculum Tree Retrieval
- [ ] Invalid Reference Validation
- [ ] End-to-End Workflow Validation

---

## Completion Criteria

All CRUD operations, validations, soft-delete functionality, and curriculum hierarchy retrieval should execute successfully without errors.

✅ Enterprise LMS Admin API Testing Complete.
