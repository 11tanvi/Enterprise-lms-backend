package com.geeknito.geeknito_backend.batch.repository;

import com.geeknito.geeknito_backend.entity.learning.BatchStudentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchStudentRepository extends JpaRepository<BatchStudentEntity, Long> {
    List<BatchStudentEntity> findByBatchId(Long batchId);
    List<BatchStudentEntity> findByStudentId(Long studentId);
    Optional<BatchStudentEntity> findByBatchIdAndStudentId(Long batchId, Long studentId);
    boolean existsByBatchIdAndStudentId(Long batchId, Long studentId);
    void deleteByBatchIdAndStudentId(Long batchId, Long studentId);

    @Query("SELECT bs FROM BatchStudentEntity bs JOIN FETCH bs.batch b JOIN FETCH b.course LEFT JOIN FETCH b.teacher WHERE bs.student.id = :studentId")
    List<BatchStudentEntity> findByStudentIdWithBatchAndCourseAndTeacher(@Param("studentId") Long studentId);
}
