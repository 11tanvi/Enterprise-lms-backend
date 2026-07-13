package com.geeknito.geeknito_backend.user.controller;

import com.geeknito.geeknito_backend.config.JwtService;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.info("Auth: Login request for email: {}", request.getEmail());

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthErrorResponse("Email address is required."));
        }

        Optional<UserEntity> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorResponse("Invalid credentials. User does not exist."));
        }

        UserEntity user = userOpt.get();
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches && user.getPassword().equals(request.getPassword())) {
            // legacy plain text match - migrate to BCrypt on-the-fly!
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
            log.info("Auth: Migrated legacy plain-text password to BCrypt for user: {}", user.getEmail());
            matches = true;
        }

        if (!matches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthErrorResponse("Invalid email or password. Please try again."));
        }

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthErrorResponse("This user account has been deactivated."));
        }

        AuthResponse response = AuthResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .token(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole()))
                .build();

        log.info("Auth: User {} logged in successfully with role: {}", user.getEmail(), user.getRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("Auth: Registration request for email: {}", request.getEmail());

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthErrorResponse("Email address is required."));
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthErrorResponse("Password must be at least 6 characters."));
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new AuthErrorResponse("A user with this email address already exists."));
        }

        // Determine role based on email or provided role field (SaaS enterprise design)
        String resolvedRole = "student";
        if (request.getRole() != null && (request.getRole().equalsIgnoreCase("admin") || request.getRole().equalsIgnoreCase("student"))) {
            resolvedRole = request.getRole().toLowerCase();
        } else if (normalizedEmail.contains("admin")) {
            resolvedRole = "admin";
        }

        UserEntity newUser = UserEntity.builder()
                .fullName(request.getFullName() != null ? request.getFullName().trim() : "Academy Learner")
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(resolvedRole)
                .isActive(true)
                .build();

        UserEntity savedUser = userRepository.save(newUser);

        AuthResponse response = AuthResponse.builder()
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .token(jwtService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole()))
                .build();

        log.info("Auth: New user registered successfully: {} with role: {}", savedUser.getEmail(), savedUser.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // DTOs
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;
        private String role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private String token;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthErrorResponse {
        private String message;
    }
}
