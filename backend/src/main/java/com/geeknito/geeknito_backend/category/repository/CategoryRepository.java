package com.geeknito.geeknito_backend.category.repository;

import com.geeknito.geeknito_backend.category.dto.CategoryWithCourseCount;
import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
    
    List<CategoryEntity> findByIsActiveTrue();

    @Query("SELECT c as category, (SELECT COUNT(co) FROM CourseEntity co WHERE co.category = c) as courseCount " +
           "FROM CategoryEntity c WHERE c.isActive = true")
    List<CategoryWithCourseCount> findByIsActiveTrueWithCourseCount();

    @Query("SELECT c as category, (SELECT COUNT(co) FROM CourseEntity co WHERE co.category = c) as courseCount " +
           "FROM CategoryEntity c")
    List<CategoryWithCourseCount> findAllWithCourseCount();

    @Query("SELECT c as category, (SELECT COUNT(co) FROM CourseEntity co WHERE co.category = c) as courseCount " +
           "FROM CategoryEntity c WHERE c.id = :id")
    Optional<CategoryWithCourseCount> findByIdWithCourseCount(@Param("id") Long id);
}
