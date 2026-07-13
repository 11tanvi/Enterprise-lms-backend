package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.EligibleStudentResponseDTO;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentEntity;
import java.util.List;

public interface EnrollmentService {

    /**
     * Enrolls a student in a course if they meet all business rules.
     *
     * @param studentId the ID of the student/user
     * @param courseId the ID of the course
     * @return the created EnrollmentEntity
     */
    EnrollmentEntity enrollStudent(Long studentId, Long courseId);

    /**
     * Retrieves all enrollments for a given student.
     *
     * @param studentId the ID of the student/user
     * @return a list of EnrollmentEntity
     */
    List<EnrollmentEntity> getMyEnrollments(Long studentId);

    /**
     * Retrieves a specific enrollment by student and course ID.
     *
     * @param studentId the ID of the student/user
     * @param courseId the ID of the course
     * @return the EnrollmentEntity
     */
    EnrollmentEntity getEnrollment(Long studentId, Long courseId);

    /**
     * Retrieves eligible students enrolled in the specified course IDs, grouped by student to remove duplicates.
     *
     * @param courseIds the list of course IDs
     * @return a list of EligibleStudentResponseDTO
     */
    List<EligibleStudentResponseDTO> getEligibleStudents(List<Long> courseIds);
}
