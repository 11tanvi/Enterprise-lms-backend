package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOptionResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long questionId;
    private String optionText;
    private boolean isCorrect;
    private int displayOrder;
}
