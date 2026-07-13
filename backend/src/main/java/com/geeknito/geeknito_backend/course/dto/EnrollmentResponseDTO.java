package com.geeknito.geeknito_backend.course.dto;

import com.geeknito.geeknito_backend.entity.learning.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private EnrollmentStatus status;
    private int progressPercentage;
    private LocalDateTime enrolledAt;
    private LocalDateTime lastAccessedAt;
    private LocalDateTime completedAt;
}
