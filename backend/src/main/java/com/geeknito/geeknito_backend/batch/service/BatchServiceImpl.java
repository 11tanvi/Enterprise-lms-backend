package com.geeknito.geeknito_backend.batch.service;

import com.geeknito.geeknito_backend.batch.dto.BatchCreateRequestDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchUpdateRequestDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentListResponseDTO;
import com.geeknito.geeknito_backend.batch.repository.BatchRepository;
import com.geeknito.geeknito_backend.batch.repository.BatchStudentRepository;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.course.repository.EnrollmentRepository;
import com.geeknito.geeknito_backend.entity.learning.*;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import com.geeknito.geeknito_backend.exception.AccessDeniedException;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchServiceImpl implements BatchService {

    private final BatchRepository batchRepository;
    private final BatchStudentRepository batchStudentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    private UserEntity getAuthenticatedUser() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new com.geeknito.geeknito_backend.exception.AuthenticationException("Full authentication is required to access this resource.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }
        throw new com.geeknito.geeknito_backend.exception.AuthenticationException("User session is invalid or expired.");
    }

    private void validateBatchOwnership(BatchEntity batch) {
        UserEntity currentUser = getAuthenticatedUser();
        String role = currentUser.getRole().toUpperCase();
        if (role.contains("ADMIN")) {
            return; // Admin can modify any batch
        }
        if (role.contains("TEACHER")) {
            if (batch.getTeacher() == null || !batch.getTeacher().getId().equals(currentUser.getId())) {
                throw new com.geeknito.geeknito_backend.exception.AccessDeniedException("You do not own this batch.");
            }
            return;
        }
        throw new com.geeknito.geeknito_backend.exception.AccessDeniedException("Access denied.");
    }

    @Override
    @Transactional
    public BatchResponseDTO createBatch(BatchCreateRequestDTO request) {
        log.info("Creating a new batch: name={}, code={}, courseId={}", request.getName(), request.getBatchCode(), request.getCourseId());

        UserEntity currentUser = getAuthenticatedUser();
        String role = currentUser.getRole().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("TEACHER")) {
            throw new com.geeknito.geeknito_backend.exception.AccessDeniedException("Access denied. Admin or Teacher privilege required.");
        }

        // 1. Verify course exists
        CourseEntity course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        // 2. Validate dates
        validateDates(request.getStartDate(), request.getEndDate());

        // 3. Unique batch name inside course
        if (batchRepository.existsByCourseIdAndName(request.getCourseId(), request.getName())) {
            throw new IllegalArgumentException("Batch name '" + request.getName() + "' already exists in this course.");
        }

        // 4. Unique batch code
        if (batchRepository.existsByBatchCode(request.getBatchCode())) {
            throw new IllegalArgumentException("Batch code '" + request.getBatchCode() + "' is already in use.");
        }

        boolean isActiveVal = request.getIsActive() != null ? request.getIsActive() : true;

        BatchEntity batch = BatchEntity.builder()
                .name(request.getName())
                .batchCode(request.getBatchCode())
                .course(course)
                .teacher(currentUser)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(isActiveVal)
                .build();

        if (isActiveVal) {
            validatePublish(batch);
        }

        BatchEntity savedBatch = batchRepository.save(batch);
        log.info("Successfully created batch with ID: {}", savedBatch.getId());
        return mapToBatchResponse(savedBatch);
    }

    private void validatePublish(BatchEntity batch) {
        if (batch.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required when publishing the batch.");
        }
        if (batch.getEndDate() == null) {
            throw new IllegalArgumentException("End date is required when publishing the batch.");
        }
        validateDates(batch.getStartDate(), batch.getEndDate());
    }

    @Override
    @Transactional
    public BatchResponseDTO updateBatch(Long id, BatchUpdateRequestDTO request) {
        log.info("Updating batch with ID: {}", id);

        BatchEntity batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));

        // Security check
        validateBatchOwnership(batch);

        // 1. Validate dates
        validateDates(request.getStartDate(), request.getEndDate());

        // 2. Unique batch name within course (excluding itself)
        if (!batch.getName().equalsIgnoreCase(request.getName()) &&
                batchRepository.existsByCourseIdAndName(batch.getCourse().getId(), request.getName())) {
            throw new IllegalArgumentException("Batch name '" + request.getName() + "' already exists in this course.");
        }

        // 3. Unique batch code (excluding itself)
        if (!batch.getBatchCode().equalsIgnoreCase(request.getBatchCode()) &&
                batchRepository.existsByBatchCode(request.getBatchCode())) {
            throw new IllegalArgumentException("Batch code '" + request.getBatchCode() + "' is already in use.");
        }

        batch.setName(request.getName());
        batch.setBatchCode(request.getBatchCode());
        batch.setStartDate(request.getStartDate());
        batch.setEndDate(request.getEndDate());
        if (request.getIsActive() != null) {
            batch.setActive(request.getIsActive());
        }

        if (batch.isActive()) {
            validatePublish(batch);
        }

        BatchEntity updatedBatch = batchRepository.save(batch);
        log.info("Successfully updated batch with ID: {}", updatedBatch.getId());
        return mapToBatchResponse(updatedBatch);
    }

    @Override
    @Transactional
    public void deleteBatch(Long id) {
        log.info("Deleting batch with ID: {}", id);
        BatchEntity batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));

        // Security check
        validateBatchOwnership(batch);

        batchRepository.delete(batch);
        log.info("Successfully deleted batch with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public BatchResponseDTO getBatch(Long id) {
        log.info("Fetching batch with ID: {}", id);
        BatchEntity batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));
        return mapToBatchResponse(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponseDTO> getBatchesByCourse(Long courseId) {
        log.info("Fetching batches for course ID: {}", courseId);
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with ID: " + courseId);
        }
        return batchRepository.findByCourseId(courseId).stream()
                .map(this::mapToBatchResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponseDTO> getMyBatchesForUser(UserEntity user) {
        log.info("Fetching my batches for user ID: {}, role: {}", user.getId(), user.getRole());
        String role = user.getRole().toUpperCase();
        if (role.contains("ADMIN")) {
            return batchRepository.findAll().stream()
                    .map(this::mapToBatchResponse)
                    .collect(Collectors.toList());
        } else if (role.contains("TEACHER")) {
            return batchRepository.findByTeacherId(user.getId()).stream()
                    .map(this::mapToBatchResponse)
                    .collect(Collectors.toList());
        } else {
            throw new com.geeknito.geeknito_backend.exception.AccessDeniedException("Access denied.");
        }
    }

    @Override
    @Transactional
    public BatchStudentResponseDTO addStudentToBatch(Long batchId, Long studentId) {
        log.info("Adding student ID: {} to batch ID: {}", studentId, batchId);

        BatchEntity batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        // Security check
        validateBatchOwnership(batch);

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        // Validation: Student must already be enrolled in the course
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(studentId, batch.getCourse().getId());
        if (!isEnrolled) {
            throw new IllegalArgumentException("Student must be enrolled in course '" + batch.getCourse().getTitle() + "' before being added to a batch.");
        }

        // Validation: Student already in this batch
        if (batchStudentRepository.existsByBatchIdAndStudentId(batchId, studentId)) {
            throw new IllegalArgumentException("Student is already added to this batch.");
        }

        BatchStudentEntity batchStudent = BatchStudentEntity.builder()
                .batch(batch)
                .student(student)
                .status(BatchStatus.ACTIVE)
                .build();

        BatchStudentEntity saved = batchStudentRepository.save(batchStudent);
        log.info("Successfully added student to batch. BatchStudent ID: {}", saved.getId());

        return mapToBatchStudentResponse(saved);
    }

    @Override
    @Transactional
    public void removeStudentFromBatch(Long batchId, Long studentId) {
        log.info("Removing student ID: {} from batch ID: {}", studentId, batchId);

        BatchEntity batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        // Security check
        validateBatchOwnership(batch);

        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with ID: " + studentId);
        }

        BatchStudentEntity batchStudent = batchStudentRepository.findByBatchIdAndStudentId(batchId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student is not enrolled in this batch."));

        batchStudentRepository.delete(batchStudent);
        log.info("Successfully removed student ID: {} from batch ID: {}", studentId, batchId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchStudentListResponseDTO> getStudentsInBatch(Long batchId) {
        log.info("Fetching students in batch ID: {}", batchId);
        BatchEntity batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));

        validateBatchOwnership(batch);

        List<BatchStudentEntity> batchStudents = batchStudentRepository.findByBatchId(batchId);
        return batchStudents.stream()
                .map(bs -> BatchStudentListResponseDTO.builder()
                        .studentId(bs.getStudent().getId())
                        .fullName(bs.getStudent().getFullName())
                        .email(bs.getStudent().getEmail())
                        .enrollmentStatus(bs.getStatus().name())
                        .status(bs.getStatus().name())
                        .joinedAt(bs.getEnrolledAt())
                        .enrolledAt(bs.getEnrolledAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponseDTO> getBatchesForStudent(Long studentId) {
        log.info("Fetching batches for student ID: {}", studentId);
        List<BatchStudentEntity> batchStudents = batchStudentRepository.findByStudentIdWithBatchAndCourseAndTeacher(studentId);
        return batchStudents.stream()
                .map(bs -> mapToBatchResponse(bs.getBatch()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BatchResponseDTO getBatchForStudent(Long studentId, Long batchId) {
        log.info("Fetching batch {} for student ID: {}", batchId, studentId);
        if (!batchStudentRepository.existsByBatchIdAndStudentId(batchId, studentId)) {
            throw new AccessDeniedException("Access denied. You are not enrolled in this batch.");
        }
        BatchEntity batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));
        return mapToBatchResponse(batch);
    }

    private void validateDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && !startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date.");
        }
    }

    private BatchResponseDTO mapToBatchResponse(BatchEntity batch) {
        int studentCount = batchStudentRepository.findByBatchId(batch.getId()).size();
        return BatchResponseDTO.builder()
                .id(batch.getId())
                .name(batch.getName())
                .batchCode(batch.getBatchCode())
                .courseId(batch.getCourse().getId())
                .courseTitle(batch.getCourse().getTitle())
                .teacherId(batch.getTeacher() != null ? batch.getTeacher().getId() : null)
                .teacherName(batch.getTeacher() != null ? batch.getTeacher().getFullName() : null)
                .startDate(batch.getStartDate())
                .endDate(batch.getEndDate())
                .isActive(batch.isActive())
                .studentCount(studentCount)
                .createdAt(batch.getCreatedAt())
                .updatedAt(batch.getUpdatedAt())
                .build();
    }

    private BatchStudentResponseDTO mapToBatchStudentResponse(BatchStudentEntity batchStudent) {
        return BatchStudentResponseDTO.builder()
                .id(batchStudent.getId())
                .batchId(batchStudent.getBatch().getId())
                .batchName(batchStudent.getBatch().getName())
                .batchCode(batchStudent.getBatch().getBatchCode())
                .studentId(batchStudent.getStudent().getId())
                .studentName(batchStudent.getStudent().getFullName())
                .studentEmail(batchStudent.getStudent().getEmail())
                .status(batchStudent.getStatus().name())
                .enrolledAt(batchStudent.getEnrolledAt())
                .build();
    }
}
