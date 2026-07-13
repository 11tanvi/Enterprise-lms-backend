package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.ContentResponseDTO;
import com.geeknito.geeknito_backend.course.dto.CourseCatalogCardDTO;
import com.geeknito.geeknito_backend.course.dto.CourseCatalogDetailDTO;
import com.geeknito.geeknito_backend.course.dto.ModuleResponseDTO;
import com.geeknito.geeknito_backend.course.service.ContentAdminService;
import com.geeknito.geeknito_backend.course.service.CourseCatalogService;
import com.geeknito.geeknito_backend.course.service.CurriculumAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public / learner-facing course catalog endpoints.
 * All routes here are matched by the {@code permitAll} rule for
 * "/courses/**" and "/catalog/courses/**" in SecurityConfig, so they are
 * reachable by students (and anonymous visitors) without the ROLE_ADMIN
 * requirement that guards "/admin/**".
 */
@RestController
@RequestMapping({"/catalog/courses", "/courses"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseCatalogController {

    private final CourseCatalogService courseCatalogService;

    // Reused read-only methods from the admin-authoring services. These are
    // safe to expose publicly because they are pure reads (no mutation) and
    // return the same shape of data already served to admins.
    private final CurriculumAdminService curriculumAdminService;
    private final ContentAdminService contentAdminService;

    @GetMapping
    public ResponseEntity<Page<CourseCatalogCardDTO>> getCatalogCourses(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<CourseCatalogCardDTO> catalogPage = courseCatalogService.getCatalogCourses(pageable);
        return ResponseEntity.ok(catalogPage);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CourseCatalogDetailDTO> getCourseDetailBySlug(@PathVariable String slug) {
        CourseCatalogDetailDTO courseDetail = courseCatalogService.getCourseDetailBySlug(slug);
        return ResponseEntity.ok(courseDetail);
    }

    @GetMapping("/active")
    public ResponseEntity<java.util.List<com.geeknito.geeknito_backend.course.dto.CourseResponseDTO>> getActiveCourses() {
        java.util.List<com.geeknito.geeknito_backend.course.dto.CourseResponseDTO> activeCourses = courseCatalogService.getActiveCourses();
        return ResponseEntity.ok(activeCourses);
    }

    /**
     * Learner-facing curriculum fetch (modules + nested submodules) for a course.
     * Fixes: students previously had no non-admin way to load a course's modules,
     * and were being sent to the ROLE_ADMIN-guarded "/admin/courses/{id}/modules"
     * endpoint, resulting in 403s and an empty module list on the course page.
     * GET /courses/{courseId}/curriculum
     */
    @GetMapping("/{courseId}/curriculum")
    public ResponseEntity<List<ModuleResponseDTO>> getCourseCurriculumForLearners(
            @PathVariable Long courseId) {
        List<ModuleResponseDTO> curriculum = curriculumAdminService.getCourseCurriculum(courseId);
        return ResponseEntity.ok(curriculum);
    }

    /**
     * Learner-facing content-block fetch for a single submodule.
     * Fixes: "Continue Learning" showing 0 content because the frontend was
     * calling the ROLE_ADMIN-guarded "/admin/submodules/{id}/contents" endpoint.
     * GET /courses/submodules/{submoduleId}/contents
     */
    @GetMapping("/submodules/{submoduleId}/contents")
    public ResponseEntity<List<ContentResponseDTO>> getSubmoduleContentsForLearners(
            @PathVariable Long submoduleId) {
        List<ContentResponseDTO> contents = contentAdminService.getContentBySubmodule(submoduleId);
        return ResponseEntity.ok(contents);
    }
}