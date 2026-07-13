package com.geeknito.geeknito_backend.assignment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class AssignmentUpdateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Assignment title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    private String description;
    private String instructions;

    @NotBlank(message = "Status is required")
    private String status;

    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;

    @NotNull(message = "Max marks is required")
    @Min(value = 1, message = "Max marks must be at least 1")
    private Integer maxMarks;

    @NotNull(message = "Passing marks is required")
    @Min(value = 0, message = "Passing marks cannot be negative")
    private Integer passingMarks;

    @NotNull(message = "Time limit is required")
    @Min(value = 0, message = "Time limit cannot be negative")
    private Integer timeLimitMinutes;

    private Boolean allowLateSubmission;
    private Boolean shuffleQuestions;
    private Boolean showResultImmediately;
    private Boolean isActive;

    private Integer maxAttempts;
    private Boolean autoSubmit;
    private Boolean shuffleOptions;
    private Boolean negativeMarking;
    private Boolean showDetailedAnswers;
    private Boolean enableCertificates;

    private List<Long> batchIds;
}
