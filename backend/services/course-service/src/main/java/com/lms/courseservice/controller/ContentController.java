package com.lms.courseservice.controller;

import com.lms.courseservice.entity.Content;
import com.lms.courseservice.service.ContentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contents")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @PostMapping
    public Content createContent(@RequestBody Content content) {
        return contentService.createContent(content);
    }

    @GetMapping
    public List<Content> getAllContents() {
        return contentService.getAllContents();
    }

    @GetMapping("/{id}")
    public Content getContentById(@PathVariable UUID id) {
        return contentService.getContentById(id);
    }

    @PutMapping("/{id}")
    public Content updateContent(@PathVariable UUID id,
                                 @RequestBody Content content) {
        return contentService.updateContent(id, content);
    }

    @DeleteMapping("/{id}")
    public void deleteContent(@PathVariable UUID id) {
        contentService.deleteContent(id);
    }
}