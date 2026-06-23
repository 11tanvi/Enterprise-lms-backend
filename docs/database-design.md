# Database Design

## Course

| Field | Type |
|---------|---------|
| id | UUID |
| title | VARCHAR |
| description | TEXT |
| status | VARCHAR |
| created_at | TIMESTAMP |

---

## Module

| Field | Type |
|---------|---------|
| id | UUID |
| course_id | UUID |
| title | VARCHAR |
| content | TEXT |

---

## Organization

| Field | Type |
|---------|---------|
| id | UUID |
| name | VARCHAR |
| email | VARCHAR |
