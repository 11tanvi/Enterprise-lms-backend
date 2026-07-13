package com.geeknito.geeknito_backend.category.service;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryWithCourseCount;
import com.geeknito.geeknito_backend.category.mapper.CategoryMapper;
import com.geeknito.geeknito_backend.category.repository.CategoryRepository;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
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
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    @CacheEvict(value = "categories", key = "'active'")
    public CategoryResponseDTO createCategory(CategoryRequestDTO requestDTO) {
        log.info("Creating new curriculum category node: {}", requestDTO.getName());
        CategoryEntity entity = categoryMapper.toEntity(requestDTO);
        if (requestDTO.getActive() != null) {
            entity.setActive(requestDTO.getActive());
        } else {
            entity.setActive(true);
        }
        CategoryEntity savedEntity = categoryRepository.save(entity);
        CategoryResponseDTO response = categoryMapper.toResponseDTO(savedEntity);
        response.setCourseCount(0L);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#id")
    public CategoryResponseDTO getCategoryById(Long id) {
        log.info("Fetching category details with ID: {}", id);
        CategoryWithCourseCount result = categoryRepository.findByIdWithCourseCount(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
        CategoryEntity entity = result.getCategory();
        Long count = result.getCourseCount();
        CategoryResponseDTO dto = categoryMapper.toResponseDTO(entity);
        dto.setCourseCount(count != null ? count : 0L);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'active'")
    public List<CategoryResponseDTO> getAllActiveCategories() {
        log.info("Fetching active category nodes from backend database store");
        return categoryRepository.findByIsActiveTrueWithCourseCount().stream()
                .map(result -> {
                    CategoryEntity entity = result.getCategory();
                    Long count = result.getCourseCount();
                    CategoryResponseDTO dto = categoryMapper.toResponseDTO(entity);
                    dto.setCourseCount(count != null ? count : 0L);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "categories", key = "'active'"),
        @CacheEvict(value = "categories", key = "#id")
    })
    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO requestDTO) {
        log.info("Updating existing category node with ID: {}", id);
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        categoryMapper.updateEntityFromDto(requestDTO, entity);
        if (requestDTO.getActive() != null) {
            entity.setActive(requestDTO.getActive());
        }
        CategoryEntity updatedEntity = categoryRepository.save(entity);
        
        long count = courseRepository.countByCategoryId(id);
        CategoryResponseDTO dto = categoryMapper.toResponseDTO(updatedEntity);
        dto.setCourseCount(count);
        return dto;
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "categories", key = "'active'"),
        @CacheEvict(value = "categories", key = "#id")
    })
    public void deleteCategory(Long id) {
        log.info("Performing enterprise-level soft-delete of category with ID: {}", id);
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        entity.setActive(false);
        categoryRepository.save(entity);
    }
}
