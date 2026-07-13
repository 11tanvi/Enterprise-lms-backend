package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
    List<QuestionEntity> findByAssignmentIdOrderByDisplayOrder(Long assignmentId);
    List<QuestionEntity> findByAssignmentIdOrderByDisplayOrderAsc(Long assignmentId);
    boolean existsByAssignmentIdAndDisplayOrder(Long assignmentId, Integer displayOrder);
}
