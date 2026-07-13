package com.geeknito.geeknito_backend.assignment.controller;

import com.geeknito.geeknito_backend.assignment.dto.AssignmentCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentResponseDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentBatchRepository;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentRepository;
import com.geeknito.geeknito_backend.assignment.service.AssignmentService;
import com.geeknito.geeknito_backend.batch.repository.BatchRepository;
import com.geeknito.geeknito_backend.course.repository.EnrollmentRepository;
import com.geeknito.geeknito_backend.entity.learning.AssignmentBatchEntity;
import com.geeknito.geeknito_backend.entity.learning.AssignmentEntity;
import com.geeknito.geeknito_backend.entity.learning.BatchEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;
import com.geeknito.geeknito_backend.exception.AuthenticationException;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentBatchRepository assignmentBatchRepository;
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;

    private UserEntity getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationException("Full authentication is required to access this resource.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }
        throw new AuthenticationException("User session is invalid or expired.");
    }

    private void validateAdminOrTeacher() {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            throw new AccessDeniedException("Access denied. Admin or Teacher privilege required.");
        }
    }

    @PostMapping
    public ResponseEntity<AssignmentResponseDTO> createAssignment(@Valid @RequestBody AssignmentCreateRequestDTO request) {
        validateAdminOrTeacher();
        AssignmentResponseDTO response = assignmentService.createAssignment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentResponseDTO> updateAssignment(@PathVariable Long id, @Valid @RequestBody AssignmentUpdateRequestDTO request) {
        validateAdminOrTeacher();
        AssignmentResponseDTO response = assignmentService.updateAssignment(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        validateAdminOrTeacher();
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping
    public ResponseEntity<List<AssignmentResponseDTO>> getAssignments() {
        UserEntity user = getAuthenticatedUser();

        String role = user.getRole().toUpperCase();

        if (role.contains("ADMIN")) {
            return ResponseEntity.ok(assignmentService.getAllAssignments());
        }

        return ResponseEntity.ok(
            assignmentService.getAssignmentsByTeacher(user.getId())
        );
    }

    @GetMapping("/student/me")
    public ResponseEntity<List<AssignmentResponseDTO>> getMyStudentAssignments() {
        UserEntity user = getAuthenticatedUser();
        if (!user.getRole().equalsIgnoreCase("student")) {
            throw new AccessDeniedException("Access denied. Student role required.");
        }
        List<AssignmentResponseDTO> response = assignmentService.getAssignmentsForStudent(user.getId());
        return ResponseEntity.ok(response);
    }




    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponseDTO> getAssignment(@PathVariable Long id) {
        UserEntity user = getAuthenticatedUser();
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));
        
        // Authorization check: Admin, Teacher, or Student enrolled in the assignment's course
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(user.getId(), assignment.getCourse().getId());
            if (!isEnrolled) {
                throw new AccessDeniedException("Access denied. You are not enrolled in the course for this assignment.");
            }
        }

        AssignmentResponseDTO response = assignmentService.getAssignment(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentResponseDTO>> getAssignmentsByCourse(@PathVariable Long courseId) {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(user.getId(), courseId);
            if (!isEnrolled) {
                throw new AccessDeniedException("Access denied. You are not enrolled in this course.");
            }
        }
        List<AssignmentResponseDTO> response = assignmentService.getAssignmentsByCourse(courseId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<AssignmentResponseDTO>> getAssignmentsByTeacher(@PathVariable Long teacherId) {
        validateAdminOrTeacher();
        List<AssignmentResponseDTO> response = assignmentService.getAssignmentsByTeacher(teacherId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<AssignmentResponseDTO> publishAssignment(@PathVariable Long id) {
        validateAdminOrTeacher();
        AssignmentResponseDTO response = assignmentService.publishAssignment(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<AssignmentResponseDTO> archiveAssignment(@PathVariable Long id) {
        validateAdminOrTeacher();
        AssignmentResponseDTO response = assignmentService.archiveAssignment(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/batches")
    public ResponseEntity<Void> addBatchesToAssignment(
            @PathVariable Long id,
            @RequestParam(value = "batchId", required = false) Long batchId,
            @RequestBody(required = false) List<Long> batchIds) {
        validateAdminOrTeacher();
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));

        if (batchIds != null && !batchIds.isEmpty()) {
            for (Long bId : batchIds) {
                if (!assignmentBatchRepository.existsByAssignmentIdAndBatchId(id, bId)) {
                    BatchEntity batch = batchRepository.findById(bId)
                            .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + bId));
                    if (!batch.getCourse().getId().equals(assignment.getCourse().getId())) {
                        throw new IllegalArgumentException("Batch ID " + bId + " does not belong to the same course as the assignment.");
                    }
                    AssignmentBatchEntity ab = AssignmentBatchEntity.builder()
                            .assignment(assignment)
                            .batch(batch)
                            .build();
                    assignmentBatchRepository.save(ab);
                }
            }
        } else if (batchId != null) {
            if (!assignmentBatchRepository.existsByAssignmentIdAndBatchId(id, batchId)) {
                BatchEntity batch = batchRepository.findById(batchId)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));
                if (!batch.getCourse().getId().equals(assignment.getCourse().getId())) {
                    throw new IllegalArgumentException("Batch ID " + batchId + " does not belong to the same course as the assignment.");
                }
                AssignmentBatchEntity ab = AssignmentBatchEntity.builder()
                        .assignment(assignment)
                        .batch(batch)
                        .build();
                assignmentBatchRepository.save(ab);
            }
        } else {
            throw new IllegalArgumentException("Must provide either a query param 'batchId' or a list of batch IDs in the request body.");
        }

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/batches/{batchId}")
    public ResponseEntity<Void> removeBatchFromAssignment(@PathVariable Long id, @PathVariable Long batchId) {
        validateAdminOrTeacher();
        if (!assignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Assignment not found with ID: " + id);
        }
        if (!batchRepository.existsById(batchId)) {
            throw new ResourceNotFoundException("Batch not found with ID: " + batchId);
        }
        AssignmentBatchEntity mapping = assignmentBatchRepository.findByAssignmentIdAndBatchId(id, batchId)
                .orElseThrow(() -> new ResourceNotFoundException("No mapping found for Assignment ID " + id + " and Batch ID " + batchId));
        assignmentBatchRepository.delete(mapping);
        return ResponseEntity.noContent().build();
    }
}
