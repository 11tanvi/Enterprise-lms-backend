package com.geeknito.geeknito_backend.course.service;

import lombok.extern.slf4j.Slf4j;
import com.geeknito.geeknito_backend.course.dto.ModuleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.ModuleResponseDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleResponseDTO;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.course.repository.ModuleRepository;
import com.geeknito.geeknito_backend.course.repository.SubmoduleRepository;
import com.geeknito.geeknito_backend.entity.learning.CourseEntity;
import com.geeknito.geeknito_backend.entity.learning.ModuleEntity;
import com.geeknito.geeknito_backend.entity.learning.SubmoduleEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CurriculumAdminServiceImpl implements CurriculumAdminService {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final SubmoduleRepository submoduleRepository;

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "curriculum", key = "#courseId"),
        @CacheEvict(value = "course-details", allEntries = true)
    })
    public ModuleResponseDTO createModule(Long courseId, ModuleRequestDTO requestDTO) {

        log.info("Adding module '{}' to Course ID: {}", requestDTO.getTitle(), courseId);

        CourseEntity course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("Course not found with ID: " + courseId));

        ModuleEntity module = ModuleEntity.builder()
                .title(requestDTO.getTitle())
                .description(requestDTO.getDescription())
                .moduleOrder(requestDTO.getModuleOrder())
                .course(course)
                .isActive(true)
                .submodules(new ArrayList<>())
                .build();

        ModuleEntity saved = moduleRepository.save(module);

        log.info("Module created successfully with ID: {}", saved.getId());

        return mapToModuleResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "curriculum", allEntries = true),
        @CacheEvict(value = "course-details", allEntries = true)
    })
    public SubmoduleResponseDTO createSubmodule(Long moduleId, SubmoduleRequestDTO requestDTO) {

        log.info("Adding submodule '{}' to Module ID: {}", requestDTO.getTitle(), moduleId);

        ModuleEntity module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new EntityNotFoundException("Module not found with ID: " + moduleId));

        SubmoduleEntity submodule = SubmoduleEntity.builder()
                .title(requestDTO.getTitle())
                .description(requestDTO.getDescription())
                .slug(requestDTO.getSlug())
                .submoduleOrder(requestDTO.getSubmoduleOrder())
                .module(module)
                .isActive(true)
                .build();

        SubmoduleEntity saved = submoduleRepository.save(submodule);

        log.info("Submodule created successfully with ID: {}", saved.getId());

        return mapToSubmoduleResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "curriculum", key = "#courseId")
    public List<ModuleResponseDTO> getCourseCurriculum(Long courseId) {
        log.info("Fetching curriculum for Course ID: {}", courseId);
        if (!courseRepository.existsById(courseId)) {
            throw new EntityNotFoundException("Course not found with ID: " + courseId);
        }

        List<ModuleEntity> modules = moduleRepository.findByCourseIdOrderByModuleOrderAsc(courseId);
        return modules.stream()
                .map(this::mapToModuleResponse)
                .collect(Collectors.toList());
    }

    private ModuleResponseDTO mapToModuleResponse(ModuleEntity entity) {
        if (entity == null) {
            return null;
        }

        List<SubmoduleResponseDTO> submoduleDTOs = new ArrayList<>();
        if (entity.getSubmodules() != null) {
            submoduleDTOs = entity.getSubmodules().stream()
                    .map(this::mapToSubmoduleResponse)
                    .collect(Collectors.toList());
        }

        return ModuleResponseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .moduleOrder(entity.getModuleOrder())
                .isActive(entity.isActive())
                .submodules(submoduleDTOs)
                .build();
    }

    private SubmoduleResponseDTO mapToSubmoduleResponse(SubmoduleEntity entity) {
        if (entity == null) {
            return null;
        }

        return SubmoduleResponseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .slug(entity.getSlug())
                .submoduleOrder(entity.getSubmoduleOrder())
                .isActive(entity.isActive())
                .build();
    }
}
