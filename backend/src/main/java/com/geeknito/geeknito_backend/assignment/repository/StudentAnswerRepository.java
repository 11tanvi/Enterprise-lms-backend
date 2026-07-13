package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.StudentAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswerEntity, Long> {
    List<StudentAnswerEntity> findBySubmissionId(Long submissionId);
    List<StudentAnswerEntity> findByQuestionId(Long questionId);
}
