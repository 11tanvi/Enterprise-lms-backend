package com.geeknito.geeknito_backend.batch.dto;

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
public class BatchStudentListResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;
    private String fullName;
    private String email;
    private String enrollmentStatus;
    private String status;
    private LocalDateTime joinedAt;
    private LocalDateTime enrolledAt;
}
