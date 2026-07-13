package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchStudentExportRow {
    private String studentId;
    private String rollNumber;
    private String fullName;
    private String email;
    private String batchName;
    private String courseTitle;
    private String enrollmentDate;
    private String enrollmentStatus;
    private String userStatus;
    private String joinedDaysAgo;
}
