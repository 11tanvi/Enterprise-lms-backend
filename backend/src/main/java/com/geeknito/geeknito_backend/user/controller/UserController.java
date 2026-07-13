package com.geeknito.geeknito_backend.user.controller;

import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;
import com.geeknito.geeknito_backend.exception.AuthenticationException;
import com.geeknito.geeknito_backend.user.dto.UserResponseDTO;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

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

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getUsers(@RequestParam(required = false) String role) {
        // Authenticate user
        getAuthenticatedUser();

        log.info("Fetching users with role: {}", role);
        List<UserEntity> users;
        if (role != null && !role.trim().isEmpty()) {
            users = userRepository.findByRoleIgnoreCase(role.trim());
        } else {
            users = userRepository.findAll();
        }

        List<UserResponseDTO> response = users.stream()
                .map(u -> UserResponseDTO.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .isActive(u.isActive())
                        .createdAt(u.getCreatedAt())
                        .updatedAt(u.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
