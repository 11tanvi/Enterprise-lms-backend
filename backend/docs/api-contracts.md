# Course APIs

## Create Course

POST /api/courses

Request
{
  "title": "Java Basics",
  "description": "Beginner Java Course"
}

Response
{
  "id": "123",
  "message": "Course Created"
}

---

## Get All Courses

GET /api/courses

---

## Get Course By Id

GET /api/courses/{id}

---

## Delete Course

DELETE /api/courses/{id}

---

# Role APIs

## Create Role

POST /api/roles

Request
{
  "name": "Counsellor",
  "is_system": false
}

Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Role Created"
}

---

## Get All Roles

GET /api/roles

---

## Get Role By Id

GET /api/roles/{id}

---

## Update Role

PUT /api/roles/{id}

Request
{
  "name": "Senior Counsellor"
}

Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Role Updated"
}

---

## Delete Role

DELETE /api/roles/{id}
*(Note: Will fail if is_system is true)*

---

## Assign Role to User

POST /api/users/{userId}/roles

Request
{
  "role_id": "550e8400-e29b-41d4-a716-446655440000",
  "scope_id": "optional-tenant-uuid"
}

Response
{
  "message": "Role Assigned Successfully"
}

---

# Permission APIs

## Create Permission

POST /api/permissions

Request
{
  "code": "COURSE_CREATE",
  "description": "Allows creation of courses"
}

Response
{
  "id": "770e8400-e29b-41d4-a716-446655440111",
  "message": "Permission Created"
}

---

## Get All Permissions

GET /api/permissions

---

## Assign Permission to Role

POST /api/roles/{roleId}/permissions

Request
{
  "permission_id": "770e8400-e29b-41d4-a716-446655440111"
}

Response
{
  "message": "Permission Added to Role"
}