package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.AssignmentCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentResponseDTO;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentBatchRepository;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentRepository;
import com.geeknito.geeknito_backend.assignment.repository.QuestionRepository;
import com.geeknito.geeknito_backend.batch.repository.BatchRepository;
import com.geeknito.geeknito_backend.batch.repository.BatchStudentRepository;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.entity.learning.*;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentBatchRepository assignmentBatchRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final QuestionRepository questionRepository;
    private final BatchStudentRepository batchStudentRepository;

    @Override
    @Transactional
    public AssignmentResponseDTO createAssignment(AssignmentCreateRequestDTO request) {
        log.info("Creating a new assignment: title={}, courseId={}, teacherId={}", request.getTitle(), request.getCourseId(), request.getTeacherId());

        // 1. Verify course exists
        CourseEntity course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        // 2. Verify teacher exists
        UserEntity teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with ID: " + request.getTeacherId()));

        // 3. Verify teacher role is ROLE_TEACHER or ROLE_ADMIN
        String role = teacher.getRole();
        if (role == null || (!role.toUpperCase().contains("TEACHER") && !role.toUpperCase().contains("ADMIN"))) {
            throw new IllegalArgumentException("User with ID " + request.getTeacherId() + " does not have teacher or admin privileges.");
        }

        // 4. Validate title uniqueness inside course
        if (assignmentRepository.existsByTitleAndCourseId(request.getTitle(), request.getCourseId())) {
            throw new IllegalArgumentException("Assignment title '" + request.getTitle() + "' already exists in this course.");
        }

        // 5. Passing marks <= Maximum marks
        if (request.getPassingMarks() > request.getMaxMarks()) {
            throw new IllegalArgumentException("Passing marks cannot exceed maximum marks.");
        }

        // 6. availableFrom <= dueDate
        validateDates(request.getAvailableFrom(), request.getDueDate());

        // Parse status safely
        AssignmentStatus status = AssignmentStatus.DRAFT;
        if (request.getStatus() != null) {
            try {
                status = AssignmentStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid assignment status: " + request.getStatus());
            }
        }

        AssignmentEntity assignment = AssignmentEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .instructions(request.getInstructions())
                .course(course)
                .teacher(teacher)
                .status(status)
                .availableFrom(request.getAvailableFrom())
                .dueDate(request.getDueDate())
                .maxMarks(request.getMaxMarks())
                .passingMarks(request.getPassingMarks())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .allowLateSubmission(request.getAllowLateSubmission() != null ? request.getAllowLateSubmission() : false)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .showResultImmediately(request.getShowResultImmediately() != null ? request.getShowResultImmediately() : true)
                .maxAttempts(request.getMaxAttempts())
                .autoSubmit(request.getAutoSubmit() != null ? request.getAutoSubmit() : true)
                .shuffleOptions(request.getShuffleOptions() != null ? request.getShuffleOptions() : true)
                .negativeMarking(request.getNegativeMarking() != null ? request.getNegativeMarking() : false)
                .showDetailedAnswers(request.getShowDetailedAnswers() != null ? request.getShowDetailedAnswers() : false)
                .enableCertificates(request.getEnableCertificates() != null ? request.getEnableCertificates() : false)
                .isActive(true)
                .build();

        AssignmentEntity savedAssignment = assignmentRepository.save(assignment);

        // 7. Map to batches (only belonging to same course)
        if (request.getBatchIds() != null && !request.getBatchIds().isEmpty()) {
            List<AssignmentBatchEntity> batchEntities = new ArrayList<>();
            for (Long batchId : request.getBatchIds()) {
                BatchEntity batch = batchRepository.findById(batchId)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

                if (!batch.getCourse().getId().equals(course.getId())) {
                    throw new IllegalArgumentException("Batch ID " + batchId + " (" + batch.getName() + ") does not belong to the course of this assignment.");
                }

                AssignmentBatchEntity ab = AssignmentBatchEntity.builder()
                        .assignment(savedAssignment)
                        .batch(batch)
                        .build();
                batchEntities.add(ab);
            }
            savedAssignment.getAssignmentBatches().addAll(batchEntities);
            assignmentBatchRepository.saveAll(batchEntities);
        }

        log.info("Successfully created assignment with ID: {}", savedAssignment.getId());
        return mapToAssignmentResponse(savedAssignment);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO updateAssignment(Long id, AssignmentUpdateRequestDTO request) {
        log.info("Updating assignment with ID: {}", id);

        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));

        // 1. Validate title uniqueness inside course if changed
        if (!assignment.getTitle().equalsIgnoreCase(request.getTitle()) &&
                assignmentRepository.existsByTitleAndCourseId(request.getTitle(), assignment.getCourse().getId())) {
            throw new IllegalArgumentException("Assignment title '" + request.getTitle() + "' already exists in this course.");
        }

        // 2. Passing marks <= Maximum marks
        if (request.getPassingMarks() > request.getMaxMarks()) {
            throw new IllegalArgumentException("Passing marks cannot exceed maximum marks.");
        }

        // 3. availableFrom <= dueDate
        validateDates(request.getAvailableFrom(), request.getDueDate());

        // Parse status safely
        AssignmentStatus status = assignment.getStatus();
        if (request.getStatus() != null) {
            try {
                status = AssignmentStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid assignment status: " + request.getStatus());
            }
        }

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setInstructions(request.getInstructions());
        assignment.setStatus(status);
        assignment.setAvailableFrom(request.getAvailableFrom());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setPassingMarks(request.getPassingMarks());
        assignment.setTimeLimitMinutes(request.getTimeLimitMinutes());
         if (request.getAllowLateSubmission() != null) {
            assignment.setAllowLateSubmission(request.getAllowLateSubmission());
        }
        if (request.getShuffleQuestions() != null) {
            assignment.setShuffleQuestions(request.getShuffleQuestions());
        }
        if (request.getShowResultImmediately() != null) {
            assignment.setShowResultImmediately(request.getShowResultImmediately());
        }
        assignment.setMaxAttempts(request.getMaxAttempts());
        if (request.getAutoSubmit() != null) {
            assignment.setAutoSubmit(request.getAutoSubmit());
        }
        if (request.getShuffleOptions() != null) {
            assignment.setShuffleOptions(request.getShuffleOptions());
        }
        if (request.getNegativeMarking() != null) {
            assignment.setNegativeMarking(request.getNegativeMarking());
        }
        if (request.getShowDetailedAnswers() != null) {
            assignment.setShowDetailedAnswers(request.getShowDetailedAnswers());
        }
        if (request.getEnableCertificates() != null) {
            assignment.setEnableCertificates(request.getEnableCertificates());
        }
        if (request.getIsActive() != null) {
            assignment.setActive(request.getIsActive());
        }

        AssignmentEntity savedAssignment = assignmentRepository.save(assignment);

        // 4. Update batch mappings: Assignment can only belong to batches of the SAME course
        if (request.getBatchIds() != null) {
            // Delete old assignment-batch relations
            List<AssignmentBatchEntity> existingMappings = assignmentBatchRepository.findByAssignmentId(id);
            assignmentBatchRepository.deleteAll(existingMappings);

            List<AssignmentBatchEntity> newMappings = new ArrayList<>();
            for (Long batchId : request.getBatchIds()) {
                BatchEntity batch = batchRepository.findById(batchId)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

                if (!batch.getCourse().getId().equals(savedAssignment.getCourse().getId())) {
                    throw new IllegalArgumentException("Batch ID " + batchId + " (" + batch.getName() + ") does not belong to the course of this assignment.");
                }

                AssignmentBatchEntity ab = AssignmentBatchEntity.builder()
                        .assignment(savedAssignment)
                        .batch(batch)
                        .build();
                newMappings.add(ab);
            }
            savedAssignment.getAssignmentBatches().clear();
            savedAssignment.getAssignmentBatches().addAll(newMappings);
            assignmentBatchRepository.saveAll(newMappings);
        }

        log.info("Successfully updated assignment with ID: {}", savedAssignment.getId());
        return mapToAssignmentResponse(savedAssignment);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long id) {
        log.info("Deleting assignment with ID: {}", id);
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));
        assignmentRepository.delete(assignment);
        log.info("Successfully deleted assignment with ID: {}", id);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO publishAssignment(Long id) {
        log.info("Publishing assignment with ID: {}", id);
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));

        // Validation: Only DRAFT or SCHEDULED assignments may be published
        if (assignment.getStatus() != AssignmentStatus.DRAFT && assignment.getStatus() != AssignmentStatus.SCHEDULED) {
            throw new IllegalArgumentException("Only assignments in DRAFT or SCHEDULED status can be published. Current status: " + assignment.getStatus());
        }

        assignment.setStatus(AssignmentStatus.PUBLISHED);
        AssignmentEntity saved = assignmentRepository.save(assignment);
        log.info("Successfully published assignment with ID: {}", saved.getId());
        return mapToAssignmentResponse(saved);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO archiveAssignment(Long id) {
        log.info("Archiving assignment with ID: {}", id);
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));

        assignment.setStatus(AssignmentStatus.ARCHIVED);
        AssignmentEntity saved = assignmentRepository.save(assignment);
        log.info("Successfully archived assignment with ID: {}", saved.getId());
        return mapToAssignmentResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentResponseDTO getAssignment(Long id) {
        log.info("Fetching assignment with ID: {}", id);
        AssignmentEntity assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + id));
        return mapToAssignmentResponse(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponseDTO> getAssignmentsByCourse(Long courseId) {
        log.info("Fetching assignments for course ID: {}", courseId);
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with ID: " + courseId);
        }
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AssignmentResponseDTO> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::mapToAssignmentResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponseDTO> getAssignmentsByTeacher(Long teacherId) {
        log.info("Fetching assignments for teacher ID: {}", teacherId);
        if (!userRepository.existsById(teacherId)) {
            throw new ResourceNotFoundException("Teacher not found with ID: " + teacherId);
        }
        return assignmentRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
    }

    private void validateDates(LocalDateTime availableFrom, LocalDateTime dueDate) {
        if (availableFrom != null && dueDate != null && !availableFrom.isBefore(dueDate) && !availableFrom.isEqual(dueDate)) {
            throw new IllegalArgumentException("Available from date must be before or equal to due date.");
        }
    }

    private AssignmentResponseDTO mapToAssignmentResponse(AssignmentEntity assignment) {
        List<AssignmentBatchEntity> abList = assignmentBatchRepository.findByAssignmentId(assignment.getId());
        List<Long> batchIds = abList.stream().map(ab -> ab.getBatch().getId()).collect(Collectors.toList());
        List<String> batchNames = abList.stream().map(ab -> ab.getBatch().getName()).collect(Collectors.toList());

        int questionCount = questionRepository.findByAssignmentIdOrderByDisplayOrder(assignment.getId()).size();

        return AssignmentResponseDTO.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .instructions(assignment.getInstructions())
                .courseId(assignment.getCourse().getId())
                .courseTitle(assignment.getCourse().getTitle())
                .teacherId(assignment.getTeacher().getId())
                .teacherName(assignment.getTeacher().getFullName())
                .status(assignment.getStatus().name())
                .availableFrom(assignment.getAvailableFrom())
                .dueDate(assignment.getDueDate())
                .maxMarks(assignment.getMaxMarks())
                .passingMarks(assignment.getPassingMarks())
                .timeLimitMinutes(assignment.getTimeLimitMinutes())
                .allowLateSubmission(assignment.isAllowLateSubmission())
                .shuffleQuestions(assignment.isShuffleQuestions())
                .showResultImmediately(assignment.isShowResultImmediately())
                .maxAttempts(assignment.getMaxAttempts())
                .autoSubmit(assignment.isAutoSubmit())
                .shuffleOptions(assignment.isShuffleOptions())
                .negativeMarking(assignment.isNegativeMarking())
                .showDetailedAnswers(assignment.isShowDetailedAnswers())
                .enableCertificates(assignment.isEnableCertificates())
                .isActive(assignment.isActive())
                .assignedBatchIds(batchIds)
                .assignedBatchNames(batchNames)
                .questionCount(questionCount)
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponseDTO> getAssignmentsForStudent(Long studentId) {
        log.info("Fetching assignments for student ID: {}", studentId);
        List<BatchStudentEntity> batchStudents = batchStudentRepository.findByStudentId(studentId);
        List<Long> activeBatchIds = batchStudents.stream()
                .filter(bs -> bs.getStatus() == BatchStatus.ACTIVE)
                .map(bs -> bs.getBatch().getId())
                .collect(Collectors.toList());

        if (activeBatchIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<AssignmentBatchEntity> assignmentBatches = assignmentBatchRepository.findByBatchIdIn(activeBatchIds);
        return assignmentBatches.stream()
                .map(AssignmentBatchEntity::getAssignment)
                .filter(AssignmentEntity::isActive)
                .distinct()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
    }
}
