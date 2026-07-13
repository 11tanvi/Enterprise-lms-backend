package com.geeknito.geeknito_backend.assignment.repository;

import com.geeknito.geeknito_backend.entity.learning.QuestionOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOptionEntity, Long> {
    List<QuestionOptionEntity> findByQuestionIdOrderByDisplayOrder(Long questionId);
    List<QuestionOptionEntity> findByQuestionIdOrderByDisplayOrderAsc(Long questionId);
}
