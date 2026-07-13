package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswerResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long submissionId;
    private Long questionId;
    private String questionTitle;
    private String questionPrompt;
    private String questionType;
    private Integer maxMarks;
    private java.util.List<QuestionOptionResponseDTO> options;
    private Long selectedOptionId;
    private String selectedOptionText;
    private String answerText;
    private String uploadedFileUrl;
    private Integer obtainedMarks;
    private String teacherFeedback;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
