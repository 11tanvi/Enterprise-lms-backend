package com.geeknito.geeknito_backend.assignment.controller;

import com.geeknito.geeknito_backend.assignment.dto.SubmissionCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.SubmissionResponseDTO;
import com.geeknito.geeknito_backend.assignment.dto.SubmissionUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.repository.SubmissionRepository;
import com.geeknito.geeknito_backend.assignment.service.SubmissionService;
import com.geeknito.geeknito_backend.entity.learning.SubmissionEntity;
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
@RequestMapping("/submissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final SubmissionRepository submissionRepository;

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

    private void validateSubmissionOwnership(Long id, UserEntity user) {
        String role = user.getRole().toUpperCase();
        if (role.contains("ADMIN") || role.contains("TEACHER")) {
            return;
        }
        SubmissionEntity submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with ID: " + id));
        if (!submission.getStudent().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied. You can only access your own submissions.");
        }
    }

    @PostMapping("/start")
    public ResponseEntity<SubmissionResponseDTO> startSubmission(@Valid @RequestBody SubmissionCreateRequestDTO request) {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            if (!request.getStudentId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied. You can only start a submission for yourself.");
            }
        }
        SubmissionResponseDTO response = submissionService.startSubmission(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmissionResponseDTO> submitAssignment(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "submissionId", required = false) Long submissionId,
            @RequestBody SubmissionUpdateRequestDTO request) {
        Long targetId = id != null ? id : submissionId;
        if (targetId == null) {
            throw new IllegalArgumentException("Submission ID must be provided as a query parameter 'id' or 'submissionId'");
        }
        UserEntity user = getAuthenticatedUser();
        validateSubmissionOwnership(targetId, user);
        SubmissionResponseDTO response = submissionService.submitAssignment(targetId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/save")
    public ResponseEntity<SubmissionResponseDTO> saveDraft(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "submissionId", required = false) Long submissionId,
            @RequestBody SubmissionUpdateRequestDTO request) {
        Long targetId = id != null ? id : submissionId;
        if (targetId == null) {
            throw new IllegalArgumentException("Submission ID must be provided as a query parameter 'id' or 'submissionId'");
        }
        UserEntity user = getAuthenticatedUser();
        validateSubmissionOwnership(targetId, user);
        SubmissionResponseDTO response = submissionService.saveDraft(targetId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (role.contains("ADMIN") || role.contains("TEACHER")) {
            List<SubmissionResponseDTO> response = submissionService.getSubmissionsByAssignment(assignmentId);
            return ResponseEntity.ok(response);
        } else {
            SubmissionResponseDTO response = submissionService.getSubmissionByAssignmentAndStudent(assignmentId, user.getId());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SubmissionResponseDTO>> getSubmissionsByStudent(@PathVariable Long studentId) {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            if (!studentId.equals(user.getId())) {
                throw new AccessDeniedException("Access denied. You can only view your own submissions.");
            }
        }
        List<SubmissionResponseDTO> response = submissionService.getSubmissionsByStudent(studentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/me")
    public ResponseEntity<List<SubmissionResponseDTO>> getMyStudentSubmissions() {
        UserEntity user = getAuthenticatedUser();
        if (!user.getRole().equalsIgnoreCase("student")) {
            throw new AccessDeniedException("Access denied. Student role required.");
        }
        List<SubmissionResponseDTO> response = submissionService.getSubmissionsByStudent(user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponseDTO> getSubmission(@PathVariable Long id) {
        UserEntity user = getAuthenticatedUser();
        validateSubmissionOwnership(id, user);
        SubmissionResponseDTO response = submissionService.getSubmission(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<SubmissionResponseDTO>> getAllSubmissions() {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            throw new AccessDeniedException("Access denied. Admin or Teacher privilege required to view all submissions.");
        }
        List<SubmissionResponseDTO> response = submissionService.getAllSubmissions();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/grade")
    public ResponseEntity<SubmissionResponseDTO> gradeSubmission(@PathVariable Long id, @RequestBody SubmissionUpdateRequestDTO request) {
        UserEntity user = getAuthenticatedUser();
        String role = user.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            throw new AccessDeniedException("Access denied. Admin or Teacher privilege required to grade submissions.");
        }
        SubmissionResponseDTO response = submissionService.gradeSubmission(id, request);
        return ResponseEntity.ok(response);
    }
}
