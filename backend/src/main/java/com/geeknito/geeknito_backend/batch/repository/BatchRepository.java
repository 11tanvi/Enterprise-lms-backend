package com.geeknito.geeknito_backend.batch.repository;

import com.geeknito.geeknito_backend.entity.learning.BatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<BatchEntity, Long> {
    List<BatchEntity> findByCourseId(Long courseId);
    List<BatchEntity> findByTeacherId(Long teacherId);
    boolean existsByNameAndCourseId(String name, Long courseId);
    boolean existsByCourseIdAndName(Long courseId, String name);
    List<BatchEntity> findByIsActiveTrue();
    Optional<BatchEntity> findByBatchCode(String batchCode);
    boolean existsByBatchCode(String batchCode);
}
