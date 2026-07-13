package com.geeknito.geeknito_backend.category.service;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryWithCourseCount;
import com.geeknito.geeknito_backend.category.repository.CategoryRepository;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;
import com.geeknito.geeknito_backend.entity.learning.CourseEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryAdminServiceImpl implements CategoryAdminService {

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "categories", key = "'active'"),
        @CacheEvict(value = "categories-admin", key = "'all'")
    })
    public CategoryResponseDTO create(CategoryRequestDTO requestDTO) {
        log.info("Admin Service: Creating new category with name: {}", requestDTO.getName());
        
        CategoryEntity entity = CategoryEntity.builder()
                .name(requestDTO.getName())
                .icon(requestDTO.getIcon())
                .description(requestDTO.getDescription())
                .color(requestDTO.getColor())
                .isActive(requestDTO.getActive() != null ? requestDTO.getActive() : true)
                .build();

        CategoryEntity saved = categoryRepository.save(entity);
        CategoryResponseDTO dto = mapToResponse(saved);
        dto.setCourseCount(0L);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories-admin", key = "#id")
    public CategoryResponseDTO getById(Long id) {
        log.info("Admin Service: Fetching category details for ID: {}", id);
        
        CategoryWithCourseCount result = categoryRepository.findByIdWithCourseCount(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with ID: " + id));
        CategoryEntity entity = result.getCategory();
        Long count = result.getCourseCount();
        CategoryResponseDTO dto = mapToResponse(entity);
        dto.setCourseCount(count != null ? count : 0L);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories-admin", key = "'all'")
    public List<CategoryResponseDTO> getAll() {
        log.info("Admin Service: Fetching all categories for admin dashboard");
        
        return categoryRepository.findAllWithCourseCount().stream()
                .map(result -> {
                    CategoryEntity entity = result.getCategory();
                    Long count = result.getCourseCount();
                    CategoryResponseDTO dto = mapToResponse(entity);
                    dto.setCourseCount(count != null ? count : 0L);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "categories", key = "'active'"),
        @CacheEvict(value = "categories", key = "#id"),
        @CacheEvict(value = "categories-admin", key = "'all'"),
        @CacheEvict(value = "categories-admin", key = "#id")
    })
    public CategoryResponseDTO update(Long id, CategoryRequestDTO requestDTO) {
        log.info("Admin Service: Updating category ID: {}", id);
        
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with ID: " + id));

        entity.setName(requestDTO.getName());
        entity.setIcon(requestDTO.getIcon());
        entity.setDescription(requestDTO.getDescription());
        entity.setColor(requestDTO.getColor());
        
        if (requestDTO.getActive() != null) {
            entity.setActive(requestDTO.getActive());
        }

        CategoryEntity updated = categoryRepository.save(entity);
        long count = courseRepository.countByCategoryId(id);
        CategoryResponseDTO dto = mapToResponse(updated);
        dto.setCourseCount(count);
        return dto;
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "categories", key = "'active'"),
        @CacheEvict(value = "categories", key = "#id"),
        @CacheEvict(value = "categories-admin", key = "'all'"),
        @CacheEvict(value = "categories-admin", key = "#id")
    })
    public void softDelete(Long id) {
        log.info("Admin Service: Hard deleting category ID: {}", id);
        
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with ID: " + id));

        // Disassociate any courses belonging to this category
        List<CourseEntity> courses = courseRepository.findByCategoryId(id);
        if (courses != null) {
            for (CourseEntity course : courses) {
                course.setCategory(null);
                courseRepository.save(course);
            }
        }

        categoryRepository.delete(entity);
    }

    private CategoryResponseDTO mapToResponse(CategoryEntity entity) {
        CategoryResponseDTO dto = CategoryResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .icon(entity.getIcon())
                .description(entity.getDescription())
                .color(entity.getColor())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .courseCount(0L)
                .build();

        dto.setActive(entity.isActive());
        return dto;
    }
}