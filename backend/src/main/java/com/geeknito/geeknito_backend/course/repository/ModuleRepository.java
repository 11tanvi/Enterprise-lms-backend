package com.geeknito.geeknito_backend.course.repository;

import com.geeknito.geeknito_backend.entity.learning.ModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    List<ModuleEntity> findByCourseIdOrderByModuleOrderAsc(Long courseId);
}
