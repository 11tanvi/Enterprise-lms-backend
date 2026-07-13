package com.geeknito.geeknito_backend.assignment.controller;

import com.geeknito.geeknito_backend.assignment.service.ExportService;
import com.geeknito.geeknito_backend.batch.repository.BatchRepository;
import com.geeknito.geeknito_backend.entity.learning.BatchEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;
import com.geeknito.geeknito_backend.exception.AuthenticationException;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/export")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExportController {

    private final ExportService exportService;
    private final BatchRepository batchRepository;

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

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<InputStreamResource> exportAssignmentResults(@PathVariable Long assignmentId) {
        validateAdminOrTeacher();
        try {
            ByteArrayInputStream bis = exportService.exportAssignmentResults(assignmentId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=Assignment_Results_Export_" + assignmentId + ".xlsx");
            
            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(new InputStreamResource(bis));
        } catch (IOException e) {
            log.error("Error generating Excel export for assignment: {}", assignmentId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<InputStreamResource> exportBatchStudents(@PathVariable Long batchId) {
        validateAdminOrTeacher();
        try {
            BatchEntity batch = batchRepository.findById(batchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + batchId));

            ByteArrayInputStream bis = exportService.exportBatchStudents(batchId);

            String sanitizedBatchName = batch.getName().replaceAll("[\\\\/:*?\"<>|]", "_");
            String filename = "Batch_" + sanitizedBatchName + "_Students.xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=" + filename);

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(new InputStreamResource(bis));
        } catch (IOException e) {
            log.error("Error generating Excel export for batch students of batch: {}", batchId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
