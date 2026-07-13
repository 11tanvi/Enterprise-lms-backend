package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionSummaryResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer totalMarks;
    private Integer obtainedMarks;
    private BigDecimal percentage;
    private boolean isLateSubmission;
}
