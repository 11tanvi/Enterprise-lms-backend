package com.geeknito.geeknito_backend.course.repository;

import com.geeknito.geeknito_backend.entity.learning.ContentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentRepository extends JpaRepository<ContentEntity, Long> {

    List<ContentEntity> findBySubmoduleIdAndIsActiveTrueOrderByContentOrderAsc(Long submoduleId);
    List<ContentEntity> findBySubmoduleIdOrderByContentOrderAsc(Long submoduleId);
}
