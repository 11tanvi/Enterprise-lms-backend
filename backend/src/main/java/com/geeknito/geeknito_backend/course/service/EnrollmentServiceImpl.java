package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.EligibleStudentResponseDTO;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.course.repository.EnrollmentRepository;
import com.geeknito.geeknito_backend.entity.learning.CourseEntity;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentEntity;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentStatus;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public EnrollmentEntity enrollStudent(Long studentId, Long courseId) {
        log.info("Processing enrollment request. Student ID: {}, Course ID: {}", studentId, courseId);

        // 1. Verify student exists
        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> {
                    log.error("Enrollment failed: Student with ID {} not found", studentId);
                    return new ResourceNotFoundException("Student not found with ID: " + studentId);
                });

        // 2. Verify course exists
        CourseEntity course = courseRepository.findById(courseId)
                .orElseThrow(() -> {
                    log.error("Enrollment failed: Course with ID {} not found", courseId);
                    return new ResourceNotFoundException("Course not found with ID: " + courseId);
                });

        // 3. Verify course is published and active
        if (!course.isActive()) {
            log.error("Enrollment failed: Course with ID {} is not published or active", courseId);
            throw new IllegalArgumentException("Cannot enroll in an inactive or unpublished course.");
        }

        // 4. Verify course category is active if present
        if (course.getCategory() != null && !course.getCategory().isActive()) {
            log.error("Enrollment failed: Category for course ID {} is inactive", courseId);
            throw new IllegalArgumentException("Cannot enroll in a course with an inactive category.");
        }

        // 5. Verify student is not already enrolled (Cannot enroll twice)
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            log.error("Enrollment failed: Student {} is already enrolled in course {}", studentId, courseId);
            throw new IllegalArgumentException("Student is already enrolled in this course.");
        }

        // 6. Build new enrollment
        EnrollmentEntity enrollment = EnrollmentEntity.builder()
                .student(student)
                .course(course)
                .status(EnrollmentStatus.ENROLLED)
                .progressPercentage(0)
                .build();

        // 7. Save and persist enrollment
        try {
            EnrollmentEntity savedEnrollment = enrollmentRepository.save(enrollment);
            log.info("Successfully enrolled student ID: {} in course ID: {}. Enrollment ID: {}", 
                    studentId, courseId, savedEnrollment.getId());
            return savedEnrollment;
        } catch (DataIntegrityViolationException ex) {
            log.error("Database conflict: Student ID {} already enrolled in Course ID {}", studentId, courseId, ex);
            throw new DataIntegrityViolationException("Unique constraint violation: Student is already enrolled in this course.", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentEntity> getMyEnrollments(Long studentId) {
        log.info("Fetching enrollments for Student ID: {}", studentId);

        if (!userRepository.existsById(studentId)) {
            log.error("Fetch failed: Student with ID {} not found", studentId);
            throw new ResourceNotFoundException("Student not found with ID: " + studentId);
        }

        return enrollmentRepository.findByStudentId(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public EnrollmentEntity getEnrollment(Long studentId, Long courseId) {
        log.info("Fetching enrollment details for Student ID: {} and Course ID: {}", studentId, courseId);

        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> {
                    log.error("Fetch failed: Enrollment not found for Student ID {} and Course ID {}", studentId, courseId);
                    return new ResourceNotFoundException(
                            String.format("Enrollment not found for student ID: %d and course ID: %d", studentId, courseId));
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<EligibleStudentResponseDTO> getEligibleStudents(List<Long> courseIds) {
        log.info("Fetching eligible students for course IDs: {}", courseIds);
        if (courseIds == null || courseIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<EnrollmentEntity> enrollments = enrollmentRepository.findByCourseIdInWithStudentAndCourse(courseIds);

        Map<UserEntity, List<EnrollmentEntity>> enrollmentsByUser = enrollments.stream()
                .collect(Collectors.groupingBy(EnrollmentEntity::getStudent));

        return enrollmentsByUser.entrySet().stream()
                .map(entry -> {
                    UserEntity student = entry.getKey();
                    List<EnrollmentEntity> userEnrollments = entry.getValue();

                    List<Long> enrolledCourseIds = userEnrollments.stream()
                            .map(e -> e.getCourse().getId())
                            .distinct()
                            .collect(Collectors.toList());

                    List<String> enrolledCourseTitles = userEnrollments.stream()
                            .map(e -> e.getCourse().getTitle())
                            .distinct()
                            .collect(Collectors.toList());

                    return EligibleStudentResponseDTO.builder()
                            .id(student.getId())
                            .fullName(student.getFullName())
                            .email(student.getEmail())
                            .courseIds(enrolledCourseIds)
                            .courseTitles(enrolledCourseTitles)
                            .build();
                })
                .sorted(java.util.Comparator.comparing(EligibleStudentResponseDTO::getId))
                .collect(Collectors.toList());
    }
}

