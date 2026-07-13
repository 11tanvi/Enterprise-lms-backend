package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.category.repository.CategoryRepository;
import com.geeknito.geeknito_backend.course.dto.CourseRequestDTO;
import com.geeknito.geeknito_backend.course.dto.CourseResponseDTO;
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
public class CourseAdminServiceImpl implements CourseAdminService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;

    private boolean isPublishedRequest(CourseRequestDTO dto) {
        if (dto.getStatus() != null) {
            return "Active".equalsIgnoreCase(dto.getStatus()) || "Published".equalsIgnoreCase(dto.getStatus());
        }
        if (dto.getIsPublished() != null) {
            return dto.getIsPublished();
        }
        return false; // Safely default to false (draft mode) if not explicitly specified as published
    }

    private void validateCourseBusinessRules(CourseRequestDTO requestDTO) {
        if (isPublishedRequest(requestDTO)) {
            // Set sensible fallbacks for description and thumbnail if empty to prevent validation crashes
            if (requestDTO.getDescription() == null || requestDTO.getDescription().trim().isEmpty()) {
                if (requestDTO.getShortDescription() != null && !requestDTO.getShortDescription().trim().isEmpty()) {
                    requestDTO.setDescription(requestDTO.getShortDescription().trim());
                } else {
                    requestDTO.setDescription("Explore the modules and lessons in the curriculum to master this course's content.");
                }
            }
            if (requestDTO.getThumbnailUrl() == null || requestDTO.getThumbnailUrl().trim().isEmpty()) {
                requestDTO.setThumbnailUrl("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop");
            }

            if (requestDTO.getTitle() == null || requestDTO.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Course title is required for published courses.");
            }
            if (requestDTO.getDescription() == null || requestDTO.getDescription().trim().isEmpty()) {
                throw new IllegalArgumentException("Course description is required for published courses.");
            }
            if (requestDTO.getThumbnailUrl() == null || requestDTO.getThumbnailUrl().trim().isEmpty()) {
                throw new IllegalArgumentException("Course thumbnail is required for published courses.");
            }
            if (requestDTO.getCategoryId() == null) {
                throw new IllegalArgumentException("Course category is required for published courses.");
            }
        }
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "course-catalog", allEntries = true),
        @CacheEvict(value = "course-details", allEntries = true),
        @CacheEvict(value = "categories", allEntries = true),
        @CacheEvict(value = "categories-admin", allEntries = true)
    })
    public CourseResponseDTO create(CourseRequestDTO requestDTO) {

        log.info("Creating course: {}", requestDTO.getTitle());

        // Validate business rules first (before database or repository operations)
        validateCourseBusinessRules(requestDTO);

        CategoryEntity category = null;
        if (requestDTO.getCategoryId() != null) {
            category = categoryRepository.findById(requestDTO.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Category not found with ID: " + requestDTO.getCategoryId()));
        }

        // Apply fallback defaulting for missing fields on Drafts
        String title = requestDTO.getTitle();
        if (title == null || title.trim().isEmpty()) {
            title = "Untitled Course";
        } else {
            title = title.trim();
        }

        String slug = requestDTO.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            if (slug.isEmpty()) {
                slug = "untitled-course";
            }
            slug += "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        } else {
            slug = slug.trim().toLowerCase();
        }

        String level = requestDTO.getLevel();
        if (level == null || level.trim().isEmpty()) {
            level = "Beginner";
        } else {
            level = level.trim();
        }

        boolean isPub = isPublishedRequest(requestDTO);
        boolean activeValue = requestDTO.getIsActive() != null ? requestDTO.getIsActive() : isPub;

        CourseEntity entity = CourseEntity.builder()
                .title(title)
                .slug(slug)
                .thumbnail(requestDTO.getThumbnailUrl())
                .shortDescription(requestDTO.getShortDescription())
                .description(requestDTO.getDescription())
                .level(level)
                .duration(requestDTO.getDuration())
                .category(category)
                .isActive(activeValue)
                .build();

        CourseEntity saved = courseRepository.save(entity);

        log.info("Course created successfully with ID: {}", saved.getId());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "course-catalog", allEntries = true),
        @CacheEvict(value = "course-details", allEntries = true),
        @CacheEvict(value = "categories", allEntries = true),
        @CacheEvict(value = "categories-admin", allEntries = true)
    })
    public CourseResponseDTO update(Long id, CourseRequestDTO requestDTO) {

        log.info("Updating course with ID: {}", id);

        // Validate business rules first (before database or repository operations)
        validateCourseBusinessRules(requestDTO);

        CourseEntity entity = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Course not found with ID: " + id));

        CategoryEntity category = null;
        if (requestDTO.getCategoryId() != null) {
            category = categoryRepository.findById(requestDTO.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Category not found with ID: " + requestDTO.getCategoryId()));
        }

        // Apply fallback defaulting for missing fields on Drafts
        String title = requestDTO.getTitle();
        if (title == null || title.trim().isEmpty()) {
            title = "Untitled Course";
        } else {
            title = title.trim();
        }

        String slug = requestDTO.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            if (slug.isEmpty()) {
                slug = "untitled-course";
            }
            slug += "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        } else {
            slug = slug.trim().toLowerCase();
        }

        String level = requestDTO.getLevel();
        if (level == null || level.trim().isEmpty()) {
            level = "Beginner";
        } else {
            level = level.trim();
        }

        boolean isPub = isPublishedRequest(requestDTO);
        boolean activeValue = requestDTO.getIsActive() != null ? requestDTO.getIsActive() : isPub;

        entity.setTitle(title);
        entity.setSlug(slug);
        entity.setThumbnail(requestDTO.getThumbnailUrl());
        entity.setShortDescription(requestDTO.getShortDescription());
        entity.setDescription(requestDTO.getDescription());
        entity.setLevel(level);
        entity.setDuration(requestDTO.getDuration());
        entity.setCategory(category);
        entity.setActive(activeValue);

        CourseEntity updated = courseRepository.save(entity);

        log.info("Course updated successfully with ID: {}", updated.getId());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "course-catalog", allEntries = true),
        @CacheEvict(value = "course-details", allEntries = true),
        @CacheEvict(value = "categories", allEntries = true),
        @CacheEvict(value = "categories-admin", allEntries = true)
    })
    public void softDelete(Long id) {

        log.info("Soft deleting course with ID: {}", id);

        CourseEntity entity = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Course not found with ID: " + id));

        entity.setActive(false);
        courseRepository.save(entity);

        log.info("Course soft-deleted successfully with ID: {}", id);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "course-catalog", allEntries = true),
        @CacheEvict(value = "course-details", allEntries = true),
        @CacheEvict(value = "categories", allEntries = true),
        @CacheEvict(value = "categories-admin", allEntries = true)
    })
    public void hardDelete(Long id) {

        log.warn("Hard deleting course with ID: {}", id);

        CourseEntity entity = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Course not found with ID: " + id));

        courseRepository.delete(entity);

        log.info("Course permanently deleted with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "course-details", key = "'id-' + #id")
    public CourseResponseDTO getById(Long id) {

        log.debug("Fetching course with ID: {}", id);

        CourseEntity entity = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Course not found with ID: " + id));

        return mapToResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "course-catalog", key = "'admin-all'")
    public List<CourseResponseDTO> getAll() {

        log.debug("Fetching all courses");

        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CourseResponseDTO mapToResponse(CourseEntity entity) {
        if (entity == null) {
            return null;
        }

        Long categoryId = entity.getCategory() != null ? entity.getCategory().getId() : null;
        String categoryName = entity.getCategory() != null ? entity.getCategory().getName() : null;

        // A course is only considered fully published/active if it's marked active and contains the required catalog fields
        boolean isPublished = entity.isActive()
                && entity.getDescription() != null && !entity.getDescription().trim().isEmpty()
                && entity.getThumbnail() != null && !entity.getThumbnail().trim().isEmpty()
                && entity.getCategory() != null;

        return CourseResponseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .slug(entity.getSlug())
                .shortDescription(entity.getShortDescription())
                .description(entity.getDescription())
                .level(entity.getLevel())
                .duration(entity.getDuration())
                .thumbnailUrl(entity.getThumbnail())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .isActive(entity.isActive())
                .isPublished(isPublished)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}