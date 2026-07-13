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
public class QuestionUpdateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Question title/text is required")
    private String title;

    private String description;

    @NotBlank(message = "Question type is required")
    private String questionType;

    @NotNull(message = "Marks field is required")
    @Min(value = 1, message = "Marks must be at least 1")
    private Integer marks;

    @NotNull(message = "Display order is required")
    private Integer displayOrder;

    private Boolean required;

    @NotNull(message = "Negative marks field is required")
    @Min(value = 0, message = "Negative marks cannot be negative")
    private Integer negativeMarks;

    private List<QuestionOptionUpdateRequestDTO> options;
}
