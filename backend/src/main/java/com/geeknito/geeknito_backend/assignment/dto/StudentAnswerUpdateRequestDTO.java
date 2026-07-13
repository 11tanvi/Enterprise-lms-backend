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
public class StudentAnswerUpdateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id; // Option to target existing answer record

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private Long selectedOptionId;
    private String answerText;
    private String uploadedFileUrl;
    private Integer obtainedMarks;
    private String teacherFeedback;
}
