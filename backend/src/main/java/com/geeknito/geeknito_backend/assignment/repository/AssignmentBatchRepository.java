package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.AssignmentBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentBatchRepository extends JpaRepository<AssignmentBatchEntity, Long> {
    List<AssignmentBatchEntity> findByAssignmentId(Long assignmentId);
    List<AssignmentBatchEntity> findByBatchId(Long batchId);
    List<AssignmentBatchEntity> findByBatchIdIn(List<Long> batchIds);
    Optional<AssignmentBatchEntity> findByAssignmentIdAndBatchId(Long assignmentId, Long batchId);
    boolean existsByAssignmentIdAndBatchId(Long assignmentId, Long batchId);
    void deleteByAssignmentIdAndBatchId(Long assignmentId, Long batchId);
}
