package com.geeknito.geeknito_backend.assignment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionCreateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @NotBlank(message = "Question title/text is required")
    private String title;

    private String description;

    @NotBlank(message = "Question type is required")
    private String questionType; // MCQ, MULTIPLE_CORRECT, TRUE_FALSE, SHORT_ANSWER, PARAGRAPH, FILE_UPLOAD

    @NotNull(message = "Marks field is required")
    @Min(value = 1, message = "Marks must be at least 1")
    @Builder.Default
    private Integer marks = 1;

    @NotNull(message = "Display order is required")
    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean required = true;

    @NotNull(message = "Negative marks field is required")
    @Min(value = 0, message = "Negative marks cannot be negative")
    @Builder.Default
    private Integer negativeMarks = 0;

    private List<QuestionOptionCreateRequestDTO> options;
}
