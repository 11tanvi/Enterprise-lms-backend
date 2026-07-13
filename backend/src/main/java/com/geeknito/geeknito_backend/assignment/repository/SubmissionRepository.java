package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.SubmissionEntity;
import com.geeknito.geeknito_backend.entity.learning.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<SubmissionEntity, Long> {
    List<SubmissionEntity> findByAssignmentId(Long assignmentId);
    List<SubmissionEntity> findByStudentId(Long studentId);
    List<SubmissionEntity> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    boolean existsByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    long countByAssignmentIdAndStudentIdAndStatusNot(Long assignmentId, Long studentId, SubmissionStatus status);
    boolean existsByAssignmentIdAndStudentIdAndStatus(Long assignmentId, Long studentId, SubmissionStatus status);
    List<SubmissionEntity> findByStatus(SubmissionStatus status);
}
