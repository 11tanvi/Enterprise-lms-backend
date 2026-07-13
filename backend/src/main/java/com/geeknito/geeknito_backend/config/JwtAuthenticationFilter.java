package com.geeknito.geeknito_backend.config;

import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7).trim();
        try {
            userEmail = jwtService.extractUsername(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<UserEntity> userOpt = userRepository.findByEmail(userEmail);
                if (userOpt.isPresent() && jwtService.isTokenValid(jwt)) {
                    UserEntity user = userOpt.get();
                    if (user.isActive()) {
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase());
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                Collections.singletonList(authority)
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        

                        // Keep backwards compatibility for any controller or attribute expecting "currentUser"
                        request.setAttribute("currentUser", user);
                    } else {
                        log.warn("JWT Authentication Filter: User is inactive: {}", userEmail);
                        sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "This user account has been deactivated.");
                        return;
                    }
                } else {
                    log.warn("JWT Authentication Filter: Invalid or expired token for: {}", userEmail);
                    sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired authentication token.");
                    return;
                }
            }
        } catch (Exception e) {
            log.error("JWT Authentication Filter: Failed to process authentication token", e);
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired authentication token.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(String.format("{\"error\": \"%s\"}", message));
    }
}
