package com.geeknito.geeknito_backend.assignment.dto;

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
public class QuestionResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long assignmentId;
    private String title;
    private String description;
    private String questionType; // QuestionType enum value as String
    private int marks;
    private int displayOrder;
    private boolean required;
    private int negativeMarks;
    private List<QuestionOptionResponseDTO> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
