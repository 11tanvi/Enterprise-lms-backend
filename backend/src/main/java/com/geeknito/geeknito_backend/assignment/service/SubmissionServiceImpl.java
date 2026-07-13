package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.*;
import com.geeknito.geeknito_backend.assignment.repository.*;
import com.geeknito.geeknito_backend.batch.repository.BatchStudentRepository;
import com.geeknito.geeknito_backend.course.repository.EnrollmentRepository;
import com.geeknito.geeknito_backend.entity.learning.*;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentBatchRepository assignmentBatchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    @Override
    @Transactional
    public SubmissionResponseDTO startSubmission(SubmissionCreateRequestDTO request) {
        log.info("Starting new submission for studentId={}, assignmentId={}", request.getStudentId(), request.getAssignmentId());

        // 1. Verify assignment exists
        AssignmentEntity assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + request.getAssignmentId()));

        // 2. Verify student exists
        UserEntity student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + request.getStudentId()));

        // 3. Verify assignment is PUBLISHED
        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Cannot start submission for an assignment that is not published. Current status: " + assignment.getStatus());
        }

        // 4. Verify student is enrolled in the course
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), assignment.getCourse().getId());
        if (!isEnrolled) {
            throw new IllegalArgumentException("Student is not enrolled in the course: " + assignment.getCourse().getTitle());
        }

        // 5. Verify student belongs to an active batch assigned to this assignment
        List<AssignmentBatchEntity> assignmentBatches = assignmentBatchRepository.findByAssignmentId(assignment.getId());
        List<Long> assignedBatchIds = assignmentBatches.stream()
                .map(ab -> ab.getBatch().getId())
                .collect(Collectors.toList());

        List<BatchStudentEntity> studentBatches = batchStudentRepository.findByStudentId(student.getId());
        boolean belongsToBatch = studentBatches.stream()
                .anyMatch(sb -> assignedBatchIds.contains(sb.getBatch().getId()) && sb.getStatus() == BatchStatus.ACTIVE);

        if (!belongsToBatch) {
            throw new IllegalArgumentException("Student does not belong to any active batch assigned to this assignment.");
        }

        // 6. Verify student has no active IN_PROGRESS draft
        if (submissionRepository.existsByAssignmentIdAndStudentIdAndStatus(assignment.getId(), student.getId(), SubmissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("You already have an active draft for this assignment.");
        }

        // 7. Verify maximum attempts limit
        long completedAttempts = submissionRepository.countByAssignmentIdAndStudentIdAndStatusNot(
                assignment.getId(), student.getId(), SubmissionStatus.IN_PROGRESS);

        Integer maxAttempts = assignment.getMaxAttempts();
        if (maxAttempts != null && maxAttempts > 0 && completedAttempts >= maxAttempts) {
            throw new IllegalArgumentException("You have reached the maximum number of allowed attempts.");
        }

        SubmissionEntity submission = SubmissionEntity.builder()
                .assignment(assignment)
                .student(student)
                .status(SubmissionStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .isLateSubmission(false)
                .answers(new ArrayList<>())
                .build();

        SubmissionEntity saved = submissionRepository.save(submission);
        log.info("Successfully started submission. ID: {}", saved.getId());
        return mapToSubmissionResponse(saved);
    }

    @Override
    @Transactional
    public SubmissionResponseDTO saveDraft(Long id, SubmissionUpdateRequestDTO request) {
        log.info("Saving draft for submission ID: {}", id);

        SubmissionEntity submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with ID: " + id));

        // Validation: Must be IN_PROGRESS
        if (submission.getStatus() != SubmissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot save draft. Submission is already " + submission.getStatus());
        }

        // Clear and replace draft answers
        submission.getAnswers().clear();

        if (request.getAnswers() != null && !request.getAnswers().isEmpty()) {
            List<StudentAnswerCreateRequestDTO> answerReqs = request.getAnswers().stream()
                    .map(ans -> StudentAnswerCreateRequestDTO.builder()
                            .questionId(ans.getQuestionId())
                            .selectedOptionId(ans.getSelectedOptionId())
                            .answerText(ans.getAnswerText())
                            .uploadedFileUrl(ans.getUploadedFileUrl())
                            .build())
                    .collect(Collectors.toList());
            populateAndValidateAnswers(submission, answerReqs, false);
        }

        SubmissionEntity saved = submissionRepository.save(submission);
        log.info("Successfully saved draft for submission ID: {}", saved.getId());
        return mapToSubmissionResponse(saved);
    }

    @Override
    @Transactional
    public SubmissionResponseDTO submitAssignment(Long id, SubmissionUpdateRequestDTO request) {
        log.info("Submitting assignment for submission ID: {}", id);

        SubmissionEntity submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with ID: " + id));

        // Validation: Must be IN_PROGRESS
        if (submission.getStatus() != SubmissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot submit. Submission status is " + submission.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        AssignmentEntity assignment = submission.getAssignment();

        // Validation: Check dueDate vs allowLateSubmission
        boolean isLate = false;
        if (assignment.getDueDate() != null && now.isAfter(assignment.getDueDate())) {
            if (!assignment.isAllowLateSubmission()) {
                throw new IllegalArgumentException("Submission failed: Late submissions are not allowed for this assignment.");
            }
            isLate = true;
        }

        // Save final answers
        submission.getAnswers().clear();
        if (request.getAnswers() != null && !request.getAnswers().isEmpty()) {
            List<StudentAnswerCreateRequestDTO> answerReqs = request.getAnswers().stream()
                    .map(ans -> StudentAnswerCreateRequestDTO.builder()
                            .questionId(ans.getQuestionId())
                            .selectedOptionId(ans.getSelectedOptionId())
                            .answerText(ans.getAnswerText())
                            .uploadedFileUrl(ans.getUploadedFileUrl())
                            .build())
                    .collect(Collectors.toList());
            populateAndValidateAnswers(submission, answerReqs, true);
        }

        int totalObtained = 0;
        for (StudentAnswerEntity ans : submission.getAnswers()) {
            if (ans.getObtainedMarks() != null) {
                totalObtained += ans.getObtainedMarks();
            }
        }
        submission.setObtainedMarks(totalObtained);
        double pct = assignment.getMaxMarks() > 0 ? ((double) totalObtained / assignment.getMaxMarks()) * 100.0 : 0.0;
        submission.setPercentage(BigDecimal.valueOf(pct));

        submission.setSubmittedAt(now);
        submission.setLateSubmission(isLate);
        submission.setStatus(isLate ? SubmissionStatus.LATE_SUBMITTED : SubmissionStatus.SUBMITTED);
        submission.setTotalMarks(assignment.getMaxMarks());

        if (submission.getStartedAt() != null) {
            long minutes = java.time.Duration.between(submission.getStartedAt(), now).toMinutes();
            submission.setTimeTakenMinutes((int) minutes);
        } else {
            submission.setTimeTakenMinutes(0);
        }

        SubmissionEntity saved = submissionRepository.save(submission);
        log.info("Successfully submitted assignment. ID: {}, status={}", saved.getId(), saved.getStatus());
        return mapToSubmissionResponse(saved);
    }

    @Override
    @Transactional
    public SubmissionResponseDTO gradeSubmission(Long id, SubmissionUpdateRequestDTO request) {
        log.info("Grading submission ID: {}", id);

        SubmissionEntity submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with ID: " + id));

        // Validation: Cannot grade if still IN_PROGRESS
        if (submission.getStatus() == SubmissionStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Cannot grade a submission that is still IN_PROGRESS.");
        }

        if (request.getObtainedMarks() != null) {
            if (request.getObtainedMarks() < 0 || request.getObtainedMarks() > submission.getTotalMarks()) {
                throw new IllegalArgumentException("Obtained marks must be between 0 and total marks (" + submission.getTotalMarks() + ").");
            }
            submission.setObtainedMarks(request.getObtainedMarks());
            double pct = ((double) request.getObtainedMarks() / submission.getTotalMarks()) * 100.0;
            submission.setPercentage(BigDecimal.valueOf(pct));
        }

        // Update status if provided, otherwise transition to GRADED
        if (request.getStatus() != null) {
            try {
                submission.setStatus(SubmissionStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid submission status: " + request.getStatus());
            }
        } else {
            submission.setStatus(SubmissionStatus.GRADED);
        }

        // Update individual answer marks and feedback
        if (request.getAnswers() != null) {
            for (StudentAnswerUpdateRequestDTO ansReq : request.getAnswers()) {
                StudentAnswerEntity answer = null;
                if (ansReq.getId() != null) {
                    answer = submission.getAnswers().stream()
                            .filter(a -> a.getId().equals(ansReq.getId()))
                            .findFirst()
                            .orElse(null);
                } else if (ansReq.getQuestionId() != null) {
                    answer = submission.getAnswers().stream()
                            .filter(a -> a.getQuestion().getId().equals(ansReq.getQuestionId()))
                            .findFirst()
                            .orElse(null);
                }

                if (answer != null) {
                    if (ansReq.getObtainedMarks() != null) {
                        if (ansReq.getObtainedMarks() < 0 || ansReq.getObtainedMarks() > answer.getQuestion().getMarks()) {
                            throw new IllegalArgumentException("Obtained marks for question ID " + answer.getQuestion().getId() + " must be between 0 and " + answer.getQuestion().getMarks());
                        }
                        answer.setObtainedMarks(ansReq.getObtainedMarks());
                    }
                    if (ansReq.getTeacherFeedback() != null) {
                        answer.setTeacherFeedback(ansReq.getTeacherFeedback());
                    }
                }
            }
        }

        SubmissionEntity saved = submissionRepository.save(submission);
        log.info("Successfully graded submission ID: {}, status={}", saved.getId(), saved.getStatus());
        return mapToSubmissionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponseDTO getSubmission(Long id) {
        log.info("Fetching submission with ID: {}", id);
        SubmissionEntity submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with ID: " + id));
        return mapToSubmissionResponse(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponseDTO> getSubmissionsByAssignment(Long assignmentId) {
        log.info("Fetching submissions for assignment ID: {}", assignmentId);
        if (!assignmentRepository.existsById(assignmentId)) {
            throw new ResourceNotFoundException("Assignment not found with ID: " + assignmentId);
        }
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponseDTO> getSubmissionsByStudent(Long studentId) {
        log.info("Fetching submissions for student ID: {}", studentId);
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with ID: " + studentId);
        }
        return submissionRepository.findByStudentId(studentId).stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponseDTO getSubmissionByAssignmentAndStudent(Long assignmentId, Long studentId) {
        log.info("Fetching submission for assignment ID: {} and student ID: {}", assignmentId, studentId);
        List<SubmissionEntity> submissions = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        if (submissions.isEmpty()) {
            throw new ResourceNotFoundException("Submission not found for assignment ID: " + assignmentId + " and student ID: " + studentId);
        }
        // Prefer IN_PROGRESS, otherwise latest by id
        SubmissionEntity submission = submissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.IN_PROGRESS)
                .findFirst()
                .orElse(submissions.get(submissions.size() - 1));
        return mapToSubmissionResponse(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponseDTO> getAllSubmissions() {
        log.info("Fetching all submissions");
        return submissionRepository.findAll().stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    private void populateAndValidateAnswers(SubmissionEntity submission, List<StudentAnswerCreateRequestDTO> answerReqs, boolean isFinalSubmit) {
        if (answerReqs == null) return;

        for (StudentAnswerCreateRequestDTO req : answerReqs) {
            QuestionEntity question = questionRepository.findById(req.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with ID: " + req.getQuestionId()));

            // Verify question belongs to the assignment
            if (!question.getAssignment().getId().equals(submission.getAssignment().getId())) {
                throw new IllegalArgumentException("Question with ID " + req.getQuestionId() + " does not belong to assignment " + submission.getAssignment().getId());
            }

            StudentAnswerEntity answer = StudentAnswerEntity.builder()
                    .submission(submission)
                    .question(question)
                    .build();

            QuestionType type = question.getQuestionType();
            if (type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) {
                if (req.getSelectedOptionId() == null) {
                    if (isFinalSubmit) {
                        throw new IllegalArgumentException("Selected option is required for MCQ / True-False question ID: " + question.getId());
                    }
                } else {
                    QuestionOptionEntity option = questionOptionRepository.findById(req.getSelectedOptionId())
                            .orElseThrow(() -> new ResourceNotFoundException("Option not found with ID: " + req.getSelectedOptionId()));

                    // Verify option belongs to question
                    if (!option.getQuestion().getId().equals(question.getId())) {
                        throw new IllegalArgumentException("Option with ID " + req.getSelectedOptionId() + " does not belong to question " + question.getId());
                    }
                    answer.setSelectedOption(option);
                }
            } else if (type == QuestionType.SHORT_ANSWER || type == QuestionType.PARAGRAPH) {
                if (req.getSelectedOptionId() != null || req.getUploadedFileUrl() != null) {
                    throw new IllegalArgumentException("Short Answer / Paragraph question ID " + question.getId() + " can only accept text answers.");
                }
                if (isFinalSubmit && (req.getAnswerText() == null || req.getAnswerText().trim().isEmpty())) {
                    throw new IllegalArgumentException("Text answer is required for Short Answer / Paragraph question ID: " + question.getId());
                }
                answer.setAnswerText(req.getAnswerText());
            } else if (type == QuestionType.FILE_UPLOAD) {
                if (req.getSelectedOptionId() != null || (req.getAnswerText() != null && !req.getAnswerText().trim().isEmpty())) {
                    throw new IllegalArgumentException("File Upload question ID " + question.getId() + " can only accept a file URL.");
                }
                if (isFinalSubmit && (req.getUploadedFileUrl() == null || req.getUploadedFileUrl().trim().isEmpty())) {
                    throw new IllegalArgumentException("File URL is required for File Upload question ID: " + question.getId());
                }
                answer.setUploadedFileUrl(req.getUploadedFileUrl());
            } else if (type == QuestionType.MULTIPLE_CORRECT) {
                if (req.getSelectedOptionId() != null) {
                    QuestionOptionEntity option = questionOptionRepository.findById(req.getSelectedOptionId())
                            .orElseThrow(() -> new ResourceNotFoundException("Option not found with ID: " + req.getSelectedOptionId()));
                    if (!option.getQuestion().getId().equals(question.getId())) {
                        throw new IllegalArgumentException("Option with ID " + req.getSelectedOptionId() + " does not belong to question " + question.getId());
                    }
                    answer.setSelectedOption(option);
                } else if (req.getAnswerText() != null && !req.getAnswerText().trim().isEmpty()) {
                    answer.setAnswerText(req.getAnswerText());
                } else if (isFinalSubmit) {
                    throw new IllegalArgumentException("Answer is required for Multiple Correct question ID: " + question.getId());
                }
            }

            if (isFinalSubmit && (type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE || type == QuestionType.MULTIPLE_CORRECT)) {
                if (answer.getSelectedOption() != null) {
                    answer.setObtainedMarks(answer.getSelectedOption().isCorrect() ? question.getMarks() : 0);
                } else {
                    answer.setObtainedMarks(0);
                }
            }

            submission.getAnswers().add(answer);
        }
    }

    private SubmissionResponseDTO mapToSubmissionResponse(SubmissionEntity submission) {
        List<StudentAnswerResponseDTO> answerResponses = submission.getAnswers().stream()
                .map(ans -> StudentAnswerResponseDTO.builder()
                        .id(ans.getId())
                        .submissionId(submission.getId())
                        .questionId(ans.getQuestion().getId())
                        .questionTitle(ans.getQuestion().getTitle())
                        .questionPrompt(ans.getQuestion().getDescription())
                        .questionType(ans.getQuestion().getQuestionType().name())
                        .maxMarks(ans.getQuestion().getMarks())
                        .options(ans.getQuestion().getOptions().stream()
                                .map(opt -> QuestionOptionResponseDTO.builder()
                                        .id(opt.getId())
                                        .questionId(opt.getQuestion().getId())
                                        .optionText(opt.getOptionText())
                                        .isCorrect(opt.isCorrect())
                                        .displayOrder(opt.getDisplayOrder())
                                        .build())
                                .collect(Collectors.toList()))
                        .selectedOptionId(ans.getSelectedOption() != null ? ans.getSelectedOption().getId() : null)
                        .selectedOptionText(ans.getSelectedOption() != null ? ans.getSelectedOption().getOptionText() : null)
                        .answerText(ans.getAnswerText())
                        .uploadedFileUrl(ans.getUploadedFileUrl())
                        .obtainedMarks(ans.getObtainedMarks())
                        .teacherFeedback(ans.getTeacherFeedback())
                        .createdAt(ans.getCreatedAt())
                        .updatedAt(ans.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return SubmissionResponseDTO.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .assignmentTitle(submission.getAssignment().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullName())
                .studentEmail(submission.getStudent().getEmail())
                .status(submission.getStatus().name())
                .startedAt(submission.getStartedAt())
                .submittedAt(submission.getSubmittedAt())
                .totalMarks(submission.getTotalMarks())
                .obtainedMarks(submission.getObtainedMarks())
                .percentage(submission.getPercentage())
                .timeTakenMinutes(submission.getTimeTakenMinutes())
                .isLateSubmission(submission.isLateSubmission())
                .answers(answerResponses)
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }
}
