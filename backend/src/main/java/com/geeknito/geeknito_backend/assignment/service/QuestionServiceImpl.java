package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.*;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentRepository;
import com.geeknito.geeknito_backend.assignment.repository.QuestionOptionRepository;
import com.geeknito.geeknito_backend.assignment.repository.QuestionRepository;
import com.geeknito.geeknito_backend.entity.learning.*;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.geeknito.geeknito_backend.assignment.repository.AssignmentBatchRepository;
import com.geeknito.geeknito_backend.batch.repository.BatchStudentRepository;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentBatchRepository assignmentBatchRepository;
    private final BatchStudentRepository batchStudentRepository;

    @Override
    @Transactional
    public QuestionResponseDTO createQuestion(QuestionCreateRequestDTO request) {
        log.info("Creating a new question for assignment ID: {}, type={}", request.getAssignmentId(), request.getQuestionType());

        // 1. Verify assignment exists
        AssignmentEntity assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + request.getAssignmentId()));

        // 2. Parse question type safely
        QuestionType type;
        try {
            type = QuestionType.valueOf(request.getQuestionType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid question type: " + request.getQuestionType());
        }

        // 3. Validate options according to type
        validateQuestionOptions(type, request.getOptions());

        QuestionEntity question = QuestionEntity.builder()
                .assignment(assignment)
                .title(request.getTitle())
                .description(request.getDescription())
                .questionType(type)
                .marks(request.getMarks() != null ? request.getMarks() : 1)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .required(request.getRequired() != null ? request.getRequired() : true)
                .negativeMarks(request.getNegativeMarks() != null ? request.getNegativeMarks() : 0)
                .options(new ArrayList<>())
                .build();

        // Build and associate options
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionCreateRequestDTO optReq : request.getOptions()) {
                QuestionOptionEntity option = QuestionOptionEntity.builder()
                        .question(question)
                        .optionText(optReq.getOptionText())
                        .isCorrect(optReq.getIsCorrect() != null ? optReq.getIsCorrect() : false)
                        .displayOrder(optReq.getDisplayOrder() != null ? optReq.getDisplayOrder() : 0)
                        .build();
                question.getOptions().add(option);
            }
        }

        QuestionEntity savedQuestion = questionRepository.save(question);
        log.info("Successfully created question with ID: {}", savedQuestion.getId());
        return mapToQuestionResponse(savedQuestion);
    }

    @Override
    @Transactional
    public QuestionResponseDTO updateQuestion(Long id, QuestionUpdateRequestDTO request) {
        log.info("Updating question with ID: {}", id);

        QuestionEntity question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));

        // 1. Parse question type safely
        QuestionType type;
        try {
            type = QuestionType.valueOf(request.getQuestionType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid question type: " + request.getQuestionType());
        }

        // 2. Validate options according to type
        validateQuestionOptions(type, request.getOptions());

        question.setTitle(request.getTitle());
        question.setDescription(request.getDescription());
        question.setQuestionType(type);
        question.setMarks(request.getMarks());
        question.setDisplayOrder(request.getDisplayOrder());
        if (request.getRequired() != null) {
            question.setRequired(request.getRequired());
        }
        question.setNegativeMarks(request.getNegativeMarks());

        // Update options: clear old and add new to avoid orphan option records
        question.getOptions().clear();

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionUpdateRequestDTO optReq : request.getOptions()) {
                QuestionOptionEntity option = QuestionOptionEntity.builder()
                        .question(question)
                        .optionText(optReq.getOptionText())
                        .isCorrect(optReq.getIsCorrect() != null ? optReq.getIsCorrect() : false)
                        .displayOrder(optReq.getDisplayOrder() != null ? optReq.getDisplayOrder() : 0)
                        .build();
                question.getOptions().add(option);
            }
        }

        QuestionEntity savedQuestion = questionRepository.save(question);
        log.info("Successfully updated question with ID: {}", savedQuestion.getId());
        return mapToQuestionResponse(savedQuestion);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        log.info("Deleting question with ID: {}", id);
        QuestionEntity question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));
        questionRepository.delete(question);
        log.info("Successfully deleted question with ID: {}", id);
    }

    @Override
    @Transactional
    public List<QuestionResponseDTO> reorderQuestions(Long assignmentId, List<Long> questionIdsInOrder) {
        log.info("Reordering questions for assignment ID: {}", assignmentId);

        if (!assignmentRepository.existsById(assignmentId)) {
            throw new ResourceNotFoundException("Assignment not found with ID: " + assignmentId);
        }

        List<QuestionEntity> questions = questionRepository.findByAssignmentIdOrderByDisplayOrder(assignmentId);

        for (int i = 0; i < questionIdsInOrder.size(); i++) {
            Long qId = questionIdsInOrder.get(i);
            int displayOrder = i;

            QuestionEntity question = questions.stream()
                    .filter(q -> q.getId().equals(qId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Question ID " + qId + " does not belong to assignment ID " + assignmentId));

            question.setDisplayOrder(displayOrder);
        }

        List<QuestionEntity> updatedQuestions = questionRepository.saveAll(questions);
        return updatedQuestions.stream()
                .map(this::mapToQuestionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponseDTO getQuestion(Long id) {
        log.info("Fetching question with ID: {}", id);
        QuestionEntity question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + id));
        return mapToQuestionResponse(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponseDTO> getQuestionsByAssignment(Long assignmentId, Long userId, String role) {
        log.info("Fetching questions for assignment ID: {}", assignmentId);
        
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));

        if (role.contains("ADMIN")) {
            // full access
        } else if (role.contains("TEACHER")) {
            if (!assignment.getTeacher().getId().equals(userId)) {
                throw new AccessDeniedException("Access denied. You do not own this assignment.");
            }
        } else if (role.contains("STUDENT")) {
            List<AssignmentBatchEntity> assignmentBatches = assignmentBatchRepository.findByAssignmentId(assignmentId);
            if (assignmentBatches.isEmpty()) {
                throw new AccessDeniedException("Access denied. You are not assigned to this assignment.");
            }
            
            List<Long> batchIds = assignmentBatches.stream()
                    .map(ab -> ab.getBatch().getId())
                    .collect(Collectors.toList());
                    
            List<BatchStudentEntity> studentBatches = batchStudentRepository.findByStudentId(userId);
            boolean hasAccess = studentBatches.stream()
                    .anyMatch(bs -> batchIds.contains(bs.getBatch().getId()) && bs.getStatus() == BatchStatus.ACTIVE);
                    
            if (!hasAccess) {
                throw new AccessDeniedException("Access denied. You are not assigned to this assignment.");
            }
        } else {
            throw new AccessDeniedException("Access denied. Invalid role.");
        }

        return questionRepository.findByAssignmentIdOrderByDisplayOrder(assignmentId).stream()
                .map(this::mapToQuestionResponse)
                .collect(Collectors.toList());
    }

    private void validateQuestionOptions(QuestionType type, List<?> options) {
        int count = options == null ? 0 : options.size();

        if (type == QuestionType.MCQ) {
            if (count == 0) {
                throw new IllegalArgumentException("MCQ must have at least one option.");
            }
            long correctCount = countCorrect(options);
            if (correctCount != 1) {
                throw new IllegalArgumentException("MCQ must have exactly ONE correct option. Found: " + correctCount);
            }
        } else if (type == QuestionType.MULTIPLE_CORRECT) {
            if (count == 0) {
                throw new IllegalArgumentException("Multiple Correct question must have at least one option.");
            }
            long correctCount = countCorrect(options);
            if (correctCount < 1) {
                throw new IllegalArgumentException("Multiple Correct question must have at least ONE correct option.");
            }
        } else if (type == QuestionType.TRUE_FALSE) {
            if (count != 2) {
                throw new IllegalArgumentException("True/False question must have exactly TWO options.");
            }
            long correctCount = countCorrect(options);
            if (correctCount != 1) {
                throw new IllegalArgumentException("True/False question must have exactly ONE correct option.");
            }
        } else if (type == QuestionType.SHORT_ANSWER || type == QuestionType.PARAGRAPH || type == QuestionType.FILE_UPLOAD) {
            if (count > 0) {
                throw new IllegalArgumentException(type.name() + " question must not have any options.");
            }
        }
    }

    private long countCorrect(List<?> options) {
        if (options == null) return 0;
        long correct = 0;
        for (Object opt : options) {
            if (opt instanceof QuestionOptionCreateRequestDTO) {
                if (Boolean.TRUE.equals(((QuestionOptionCreateRequestDTO) opt).getIsCorrect())) {
                    correct++;
                }
            } else if (opt instanceof QuestionOptionUpdateRequestDTO) {
                if (Boolean.TRUE.equals(((QuestionOptionUpdateRequestDTO) opt).getIsCorrect())) {
                    correct++;
                }
            }
        }
        return correct;
    }

    private QuestionResponseDTO mapToQuestionResponse(QuestionEntity question) {
        List<QuestionOptionResponseDTO> optionResponses = question.getOptions().stream()
                .map(opt -> QuestionOptionResponseDTO.builder()
                        .id(opt.getId())
                        .questionId(question.getId())
                        .optionText(opt.getOptionText())
                        .isCorrect(opt.isCorrect())
                        .displayOrder(opt.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return QuestionResponseDTO.builder()
                .id(question.getId())
                .assignmentId(question.getAssignment().getId())
                .title(question.getTitle())
                .description(question.getDescription())
                .questionType(question.getQuestionType().name())
                .marks(question.getMarks())
                .displayOrder(question.getDisplayOrder())
                .required(question.isRequired())
                .negativeMarks(question.getNegativeMarks())
                .options(optionResponses)
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }
}
