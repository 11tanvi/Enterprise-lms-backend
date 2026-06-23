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