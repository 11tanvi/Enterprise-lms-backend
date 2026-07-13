package com.geeknito.geeknito_backend.course.repository;

import com.geeknito.geeknito_backend.entity.learning.EnrollmentEntity;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<EnrollmentEntity, Long> {

    /**
     * Checks if an enrollment exists for a given student and course.
     * Useful for validation before creating a duplicate enrollment.
     */
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    /**
     * Retrieves all enrollments for a given student.
     * Used for loading student dashboard data / my courses list.
     */
    List<EnrollmentEntity> findByStudentId(Long studentId);

    /**
     * Retrieves all enrollments of a student filtered by a specific status (e.g., COMPLETED, ENROLLED).
     * Used for loading filtered learning tabs (e.g., active vs. completed courses).
     */
    List<EnrollmentEntity> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    /**
     * Retrieves all enrollments for a given course.
     * Used for admin reporting, course rosters, or analytics.
     */
    List<EnrollmentEntity> findByCourseId(Long courseId);

    /**
     * Finds a specific enrollment by student ID and course ID.
     * Used to load dynamic course buttons (e.g. Resume Learning vs Enroll) or checking progress detail.
     */
    Optional<EnrollmentEntity> findByStudentIdAndCourseId(Long studentId, Long courseId);

    /**
     * Counts the total number of enrollments for a specific course.
     * Used for course popularity metrics, public registration counts, or dashboard stats.
     */
    long countByCourseId(Long courseId);

    /**
     * Counts the total number of enrollments for a specific student.
     * Used for student profile metrics (e.g., counting courses in progress).
     */
    long countByStudentId(Long studentId);

    /**
     * Retrieves all enrollments with student and course eagerly loaded for a list of course IDs.
     */
    @Query("SELECT e FROM EnrollmentEntity e JOIN FETCH e.student JOIN FETCH e.course WHERE e.course.id IN :courseIds")
    List<EnrollmentEntity> findByCourseIdInWithStudentAndCourse(@Param("courseIds") List<Long> courseIds);
}
