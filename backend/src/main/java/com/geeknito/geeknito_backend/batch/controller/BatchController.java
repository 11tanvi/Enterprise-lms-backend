package com.geeknito.geeknito_backend.batch.controller;

import com.geeknito.geeknito_backend.batch.dto.BatchCreateRequestDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentListResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchUpdateRequestDTO;
import com.geeknito.geeknito_backend.batch.service.BatchService;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;
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

@Slf4j
@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BatchController {

    private final BatchService batchService;

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
    public ResponseEntity<BatchResponseDTO> createBatch(@Valid @RequestBody BatchCreateRequestDTO request) {
        validateAdminOrTeacher();
        BatchResponseDTO response = batchService.createBatch(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BatchResponseDTO>> getMyBatches() {
        validateAdminOrTeacher();
        UserEntity user = getAuthenticatedUser();
        List<BatchResponseDTO> response = batchService.getMyBatchesForUser(user);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BatchResponseDTO> updateBatch(@PathVariable Long id, @Valid @RequestBody BatchUpdateRequestDTO request) {
        validateAdminOrTeacher();
        BatchResponseDTO response = batchService.updateBatch(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        validateAdminOrTeacher();
        batchService.deleteBatch(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BatchResponseDTO> getBatch(@PathVariable Long id) {
        validateAdminOrTeacher();
        BatchResponseDTO response = batchService.getBatch(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<BatchResponseDTO>> getBatchesByCourse(@PathVariable Long courseId) {
        validateAdminOrTeacher();
        List<BatchResponseDTO> response = batchService.getBatchesByCourse(courseId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{batchId}/students/{studentId}")
    public ResponseEntity<BatchStudentResponseDTO> addStudentToBatch(@PathVariable Long batchId, @PathVariable Long studentId) {
        validateAdminOrTeacher();
        BatchStudentResponseDTO response = batchService.addStudentToBatch(batchId, studentId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{batchId}/students/{studentId}")
    public ResponseEntity<Void> removeStudentFromBatch(@PathVariable Long batchId, @PathVariable Long studentId) {
        validateAdminOrTeacher();
        batchService.removeStudentFromBatch(batchId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{batchId}/students")
    public ResponseEntity<List<BatchStudentListResponseDTO>> getStudentsInBatch(@PathVariable Long batchId) {
        validateAdminOrTeacher();
        List<BatchStudentListResponseDTO> response = batchService.getStudentsInBatch(batchId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/me")
    public ResponseEntity<List<BatchResponseDTO>> getMyStudentBatches() {
        UserEntity user = getAuthenticatedUser();
        if (!user.getRole().equalsIgnoreCase("student")) {
            throw new AccessDeniedException("Access denied. Student role required.");
        }
        List<BatchResponseDTO> response = batchService.getBatchesForStudent(user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/me/{batchId}")
    public ResponseEntity<BatchResponseDTO> getMyStudentBatch(@PathVariable Long batchId) {
        UserEntity user = getAuthenticatedUser();
        if (!user.getRole().equalsIgnoreCase("student")) {
            throw new AccessDeniedException("Access denied. Student role required.");
        }
        BatchResponseDTO response = batchService.getBatchForStudent(user.getId(), batchId);
        return ResponseEntity.ok(response);
    }
}
