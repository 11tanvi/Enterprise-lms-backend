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
public class AssignmentCreateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Assignment title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    private String description;
    private String instructions;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;

    @Builder.Default
    private String status = "DRAFT";

    private LocalDateTime availableFrom;
    private LocalDateTime dueDate;

    @NotNull(message = "Max marks is required")
    @Min(value = 1, message = "Max marks must be at least 1")
    @Builder.Default
    private Integer maxMarks = 100;

    @NotNull(message = "Passing marks is required")
    @Min(value = 0, message = "Passing marks cannot be negative")
    @Builder.Default
    private Integer passingMarks = 40;

    @NotNull(message = "Time limit is required")
    @Min(value = 0, message = "Time limit cannot be negative")
    @Builder.Default
    private Integer timeLimitMinutes = 0; // 0 means no limit

    @Builder.Default
    private Boolean allowLateSubmission = false;

    @Builder.Default
    private Boolean shuffleQuestions = false;

    @Builder.Default
    private Boolean showResultImmediately = true;

    private Integer maxAttempts;

    @Builder.Default
    private Boolean autoSubmit = true;

    @Builder.Default
    private Boolean shuffleOptions = true;

    @Builder.Default
    private Boolean negativeMarking = false;

    @Builder.Default
    private Boolean showDetailedAnswers = false;

    @Builder.Default
    private Boolean enableCertificates = false;

    private List<Long> batchIds;
}
