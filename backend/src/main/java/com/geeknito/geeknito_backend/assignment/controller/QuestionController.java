package com.geeknito.geeknito_backend.assignment.controller;

import com.geeknito.geeknito_backend.assignment.dto.QuestionCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.QuestionResponseDTO;
import com.geeknito.geeknito_backend.assignment.dto.QuestionUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.service.QuestionService;
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
@RequestMapping("/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionService questionService;

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
    public ResponseEntity<QuestionResponseDTO> createQuestion(@Valid @RequestBody QuestionCreateRequestDTO request) {
        validateAdminOrTeacher();
        QuestionResponseDTO response = questionService.createQuestion(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> updateQuestion(@PathVariable Long id, @Valid @RequestBody QuestionUpdateRequestDTO request) {
        validateAdminOrTeacher();
        QuestionResponseDTO response = questionService.updateQuestion(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        validateAdminOrTeacher();
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<QuestionResponseDTO>> getQuestionsByAssignment(@PathVariable Long assignmentId) {
        UserEntity user = getAuthenticatedUser();
        List<QuestionResponseDTO> response = questionService.getQuestionsByAssignment(assignmentId, user.getId(), user.getRole().toUpperCase());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/assignment/{assignmentId}/reorder")
    public ResponseEntity<List<QuestionResponseDTO>> reorderQuestions(@PathVariable Long assignmentId, @RequestBody List<Long> questionIds) {
        validateAdminOrTeacher();
        List<QuestionResponseDTO> response = questionService.reorderQuestions(assignmentId, questionIds);
        return ResponseEntity.ok(response);
    }
}
