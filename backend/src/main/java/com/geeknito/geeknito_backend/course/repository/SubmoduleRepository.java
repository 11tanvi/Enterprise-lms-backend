package com.geeknito.geeknito_backend.course.repository;

import com.geeknito.geeknito_backend.entity.learning.SubmoduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubmoduleRepository extends JpaRepository<SubmoduleEntity, Long> {
}
