package com.geeknito.geeknito_backend.category.controller;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;
import com.geeknito.geeknito_backend.category.service.CategoryAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryAdminController {

    private final CategoryAdminService categoryAdminService;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> create(@Valid @RequestBody CategoryRequestDTO requestDTO) {
        CategoryResponseDTO created = categoryAdminService.create(requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAll() {
        List<CategoryResponseDTO> list = categoryAdminService.getAll();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getById(@PathVariable Long id) {
        CategoryResponseDTO category = categoryAdminService.getById(id);
        return ResponseEntity.ok(category);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> update(@PathVariable Long id, @Valid @RequestBody CategoryRequestDTO requestDTO) {
        CategoryResponseDTO updated = categoryAdminService.update(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryAdminService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
