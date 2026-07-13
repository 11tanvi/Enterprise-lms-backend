package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.QuestionCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.QuestionUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.QuestionResponseDTO;

import java.util.List;

public interface QuestionService {
    QuestionResponseDTO createQuestion(QuestionCreateRequestDTO request);
    QuestionResponseDTO updateQuestion(Long id, QuestionUpdateRequestDTO request);
    void deleteQuestion(Long id);
    List<QuestionResponseDTO> reorderQuestions(Long assignmentId, List<Long> questionIdsInOrder);
    QuestionResponseDTO getQuestion(Long id);
    List<QuestionResponseDTO> getQuestionsByAssignment(Long assignmentId, Long userId, String role);
}
