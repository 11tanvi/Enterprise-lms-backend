package com.geeknito.geeknito_backend.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOptionCreateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Option text is required")
    private String optionText;

    @Builder.Default
    private Boolean isCorrect = false;

    @Builder.Default
    private Integer displayOrder = 0;
}
