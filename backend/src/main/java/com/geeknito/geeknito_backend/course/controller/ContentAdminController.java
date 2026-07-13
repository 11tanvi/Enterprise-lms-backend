package com.geeknito.geeknito_backend.course.controller;

import com.geeknito.geeknito_backend.course.dto.ContentRequestDTO;
import com.geeknito.geeknito_backend.course.dto.ContentResponseDTO;
import com.geeknito.geeknito_backend.course.service.ContentAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/submodules/{submoduleId}/contents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContentAdminController {

    private final ContentAdminService contentAdminService;

    @PostMapping
    public ResponseEntity<ContentResponseDTO> createContent(
            @PathVariable Long submoduleId,
            @RequestBody ContentRequestDTO requestDTO) {
        ContentResponseDTO created = contentAdminService.createContent(submoduleId, requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ContentResponseDTO>> getContentBySubmodule(
            @PathVariable Long submoduleId) {
        List<ContentResponseDTO> contents = contentAdminService.getContentBySubmodule(submoduleId);
        return ResponseEntity.ok(contents);
    }

    @PutMapping("/{contentId}")
    public ResponseEntity<ContentResponseDTO> updateContent(
            @PathVariable Long submoduleId,
            @PathVariable Long contentId,
            @RequestBody ContentRequestDTO requestDTO) {
        ContentResponseDTO updated = contentAdminService.updateContent(contentId, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{contentId}")
    public ResponseEntity<Void> deleteContent(
            @PathVariable Long submoduleId,
            @PathVariable Long contentId) {
        contentAdminService.deleteContent(contentId);
        return ResponseEntity.noContent().build();
    }
}
