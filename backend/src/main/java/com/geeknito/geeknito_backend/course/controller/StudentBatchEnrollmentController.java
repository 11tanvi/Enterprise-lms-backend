package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.EnrollmentResponseDTO;
import com.geeknito.geeknito_backend.course.mapper.EnrollmentMapper;
import com.geeknito.geeknito_backend.course.service.EnrollmentService;
import com.geeknito.geeknito_backend.entity.learning.EnrollmentEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AuthenticationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/students/batches", "/students/batches"})
@RequiredArgsConstructor
public class StudentBatchEnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * Enrolls the authenticated student into a course based on batch ID.
     */
    @PostMapping("/{batchId}/enroll")
    public ResponseEntity<EnrollmentResponseDTO> enrollInBatch(@PathVariable String batchId) {
        UserEntity student = getAuthenticatedStudent();
        log.info("REST: Enroll student ID: {} in batch ID: {}", student.getId(), batchId);

        // Map batchId to courseId
        Long courseId = 1L; // default
        if (batchId.contains("compliance") || batchId.contains("gdpr") || batchId.equals("3")) {
            courseId = 3L;
        } else if (batchId.contains("cyber") || batchId.equals("1")) {
            courseId = 1L;
        } else if (batchId.contains("ldr") || batchId.contains("lead") || batchId.equals("2")) {
            courseId = 2L;
        } else if (batchId.contains("pm") || batchId.contains("project") || batchId.equals("5")) {
            courseId = 5L;
        } else if (batchId.contains("diversity") || batchId.equals("4")) {
            courseId = 4L;
        } else {
            // Try to parse number if any
            try {
                String numericOnly = batchId.replaceAll("[^0-9]", "");
                if (!numericOnly.isEmpty()) {
                    courseId = Long.parseLong(numericOnly);
                }
            } catch (Exception e) {
                log.warn("Could not parse numeric course ID from batch ID: {}", batchId);
            }
        }

        EnrollmentEntity enrollment = enrollmentService.enrollStudent(student.getId(), courseId);
        EnrollmentResponseDTO responseDTO = EnrollmentMapper.toResponseDTO(enrollment);

        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    private UserEntity getAuthenticatedStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationException("Full authentication is required to access this resource.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }

        throw new AuthenticationException("User session is invalid or expired. Please log in again.");
    }
}
