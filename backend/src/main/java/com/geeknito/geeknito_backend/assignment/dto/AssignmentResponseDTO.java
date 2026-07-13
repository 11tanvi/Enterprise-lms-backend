package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String description;
    private String instructions;
    private Long courseId;
    private String courseTitle;
    private Long teacherId;
    private String teacherName;
    private String status; // AssignmentStatus enum value as String
    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private Integer passingMarks;
    private Integer timeLimitMinutes;
    private boolean allowLateSubmission;
    private boolean shuffleQuestions;
    private boolean showResultImmediately;
    private boolean isActive;
    
    private Integer maxAttempts;
    private boolean autoSubmit;
    private boolean shuffleOptions;
    private boolean negativeMarking;
    private boolean showDetailedAnswers;
    private boolean enableCertificates;

    private List<Long> assignedBatchIds;
    private List<String> assignedBatchNames;
    private int questionCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
