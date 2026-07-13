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
public class QuestionOptionUpdateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id; // Optional ID for existing option, null for new options to be created

    @NotBlank(message = "Option text is required")
    private String optionText;

    private Boolean isCorrect;
    private Integer displayOrder;
}
