package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.EligibleStudentResponseDTO;
import com.geeknito.geeknito_backend.course.dto.EnrollmentRequestDTO;
import com.geeknito.geeknito_backend.course.dto.EnrollmentResponseDTO;
import com.geeknito.geeknito_backend.course.mapper.EnrollmentMapper;
import com.geeknito.geeknito_backend.course.service.EnrollmentService;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AuthenticationException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping({"/enrollments", "/enrollments", "/enrollments"})
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * Retrieves eligible students enrolled in the specified course IDs.
     * Allowed for ADMIN and TEACHER roles (secured via SecurityConfig).
     *
     * @param courseIds the list of course IDs to filter by
     * @return a list of eligible students
     */
    @GetMapping("/eligible-students")
    public ResponseEntity<List<EligibleStudentResponseDTO>> getEligibleStudents(@RequestParam List<Long> courseIds) {
        log.info("REST: Fetching eligible students for course IDs: {}", courseIds);
        List<EligibleStudentResponseDTO> eligibleStudents = enrollmentService.getEligibleStudents(courseIds);
        return ResponseEntity.ok(eligibleStudents);
    }

    /**
     * Enrolls the currently authenticated student into a course.
     *
     * @param request the enrollment request payload containing courseId
     * @return the created enrollment details
     */
    @PostMapping
    public ResponseEntity<EnrollmentResponseDTO> enrollStudent(@Valid @RequestBody EnrollmentRequestDTO request) {
        UserEntity student = getAuthenticatedStudent();
        log.info("REST: Enroll student ID: {} in course ID: {}", student.getId(), request.getCourseId());

        EnrollmentEntity enrollment = enrollmentService.enrollStudent(student.getId(), request.getCourseId());
        EnrollmentResponseDTO responseDTO = EnrollmentMapper.toResponseDTO(enrollment);

        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    /**
     * Retrieves all enrollments of the currently authenticated student.
     *
     * @return the list of student's enrollments
     */
    @GetMapping("/me")
    public ResponseEntity<List<EnrollmentResponseDTO>> getMyEnrollments() {
        UserEntity student = getAuthenticatedStudent();
        log.info("REST: Fetching all enrollments for student ID: {}", student.getId());

        List<EnrollmentEntity> enrollments = enrollmentService.getMyEnrollments(student.getId());
        List<EnrollmentResponseDTO> responseDTOs = enrollments.stream()
                .map(EnrollmentMapper::toResponseDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseDTOs);
    }

    /**
     * Retrieves enrollment details of the authenticated student for a specific course.
     *
     * @param courseId the ID of the course
     * @return the enrollment details
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<EnrollmentResponseDTO> getEnrollmentByCourse(@PathVariable Long courseId) {
        UserEntity student = getAuthenticatedStudent();
        log.info("REST: Fetching enrollment details for student ID: {} and course ID: {}", student.getId(), courseId);

        EnrollmentEntity enrollment = enrollmentService.getEnrollment(student.getId(), courseId);
        EnrollmentResponseDTO responseDTO = EnrollmentMapper.toResponseDTO(enrollment);

        return ResponseEntity.ok(responseDTO);
    }

    /**
     * Helper method to extract the authenticated user (student) from the Security Context.
     * Throws an AuthenticationException if the user is not found or is unauthenticated.
     */
    private UserEntity getAuthenticatedStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("REST Auth Failure: Security context authentication is missing or unauthenticated");
            throw new AuthenticationException("Full authentication is required to access this resource.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }

        log.error("REST Auth Failure: Principal in Security Context is not of type UserEntity");
        throw new AuthenticationException("User session is invalid or expired. Please log in again.");
    }
}
