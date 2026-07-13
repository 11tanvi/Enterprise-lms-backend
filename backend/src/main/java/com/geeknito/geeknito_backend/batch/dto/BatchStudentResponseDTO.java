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
public class BatchStudentResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long batchId;
    private String batchName;
    private String batchCode;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String status; // BatchStatus enum value as String
    private LocalDateTime enrolledAt;
}
