package com.lms.courseservice.service.impl;

import com.lms.courseservice.entity.Content;
import com.lms.courseservice.repository.ContentRepository;
import com.lms.courseservice.service.ContentService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ContentServiceImpl implements ContentService {

    private final ContentRepository contentRepository;

    public ContentServiceImpl(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    @Override
    public Content createContent(Content content) {
        return contentRepository.save(content);
    }

    @Override
    public List<Content> getAllContents() {
        return contentRepository.findAll();
    }

    @Override
    public Content getContentById(UUID id) {
        return contentRepository.findById(id).orElse(null);
    }

    @Override
    public Content updateContent(UUID id, Content content) {

        Content existing = contentRepository.findById(id).orElse(null);

        if (existing != null) {
            existing.setTitle(content.getTitle());
            existing.setType(content.getType());
            existing.setUrl(content.getUrl());
            existing.setSubmodule(content.getSubmodule());

            return contentRepository.save(existing);
        }

        return null;
    }

    @Override
    public void deleteContent(UUID id) {
        contentRepository.deleteById(id);
    }
}