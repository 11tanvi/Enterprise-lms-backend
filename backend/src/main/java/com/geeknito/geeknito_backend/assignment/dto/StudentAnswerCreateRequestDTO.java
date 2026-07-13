package com.geeknito.geeknito_backend.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerCreateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private Long selectedOptionId; // For MCQ and True/False questions
    private String answerText;      // For Short Answer and Essay questions
    private String uploadedFileUrl; // For File Upload questions
}
