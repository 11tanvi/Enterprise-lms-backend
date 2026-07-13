package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.AssignmentEntity;
import com.geeknito.geeknito_backend.entity.learning.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<AssignmentEntity, Long> {
    List<AssignmentEntity> findByCourseId(Long courseId);
    List<AssignmentEntity> findByTeacherId(Long teacherId);
    List<AssignmentEntity> findByStatus(AssignmentStatus status);
    List<AssignmentEntity> findByIsActiveTrue();
    boolean existsByTitleAndCourseId(String title, Long courseId);
}
