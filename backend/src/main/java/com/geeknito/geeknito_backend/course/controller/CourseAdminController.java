package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.CourseRequestDTO;
import com.geeknito.geeknito_backend.course.dto.CourseResponseDTO;
import com.geeknito.geeknito_backend.course.service.CourseAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseAdminController {

    private final CourseAdminService courseAdminService;

    @PostMapping
    public ResponseEntity<CourseResponseDTO> create(@RequestBody CourseRequestDTO requestDTO) {
        CourseResponseDTO created = courseAdminService.create(requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponseDTO>> getAll() {
        List<CourseResponseDTO> courses = courseAdminService.getAll();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDTO> getById(@PathVariable Long id) {
        CourseResponseDTO course = courseAdminService.getById(id);
        return ResponseEntity.ok(course);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponseDTO> update(@PathVariable Long id, @RequestBody CourseRequestDTO requestDTO) {
        CourseResponseDTO updated = courseAdminService.update(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam(value = "hard", defaultValue = "false") boolean hard) {
        if (hard) {
            courseAdminService.hardDelete(id);
        } else {
            courseAdminService.softDelete(id);
        }
        return ResponseEntity.noContent().build();
    }
}
