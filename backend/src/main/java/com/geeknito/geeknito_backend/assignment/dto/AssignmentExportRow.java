package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentExportRow {
    private String rollNumber;
    private String studentName;
    private String email;
    private String assignmentName;
    private String batchName;
    private String score;
    private String percentage;
    private String grade;
    private String submissionStatus;
    private Integer numberOfAttempts;
    private String lateSubmission;
    private String certificateIssued;
    private String submittedAt;
}
