package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.ModuleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.ModuleResponseDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleResponseDTO;
import com.geeknito.geeknito_backend.course.service.CurriculumAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/courses/{courseId}/modules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CurriculumAdminController {

    private final CurriculumAdminService curriculumAdminService;

    @PostMapping
    public ResponseEntity<ModuleResponseDTO> createModule(
            @PathVariable Long courseId,
            @RequestBody ModuleRequestDTO requestDTO) {
        ModuleResponseDTO created = curriculumAdminService.createModule(courseId, requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PostMapping("/{moduleId}/submodules")
    public ResponseEntity<SubmoduleResponseDTO> createSubmodule(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody SubmoduleRequestDTO requestDTO) {
        SubmoduleResponseDTO created = curriculumAdminService.createSubmodule(moduleId, requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ModuleResponseDTO>> getCourseCurriculum(
            @PathVariable Long courseId) {
        List<ModuleResponseDTO> curriculum = curriculumAdminService.getCourseCurriculum(courseId);
        return ResponseEntity.ok(curriculum);
    }
}
