package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String status; // SubmissionStatus enum value as String
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer totalMarks;
    private Integer obtainedMarks;
    private BigDecimal percentage;
    private Integer timeTakenMinutes;
    private boolean isLateSubmission;
    private List<StudentAnswerResponseDTO> answers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
