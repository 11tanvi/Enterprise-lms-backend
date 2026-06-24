package com.lms.courseservice.service;

import com.lms.courseservice.entity.Course;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    Course createCourse(Course course);

    List<Course> getAllCourses();

    Course getCourseById(UUID id);

    Course updateCourse(UUID id, Course course);

    void deleteCourse(UUID id);
}