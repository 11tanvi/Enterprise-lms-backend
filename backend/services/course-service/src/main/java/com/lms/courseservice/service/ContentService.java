package com.lms.courseservice.service;

import com.lms.courseservice.entity.Content;

import java.util.List;
import java.util.UUID;

public interface ContentService {

    Content createContent(Content content);

    List<Content> getAllContents();

    Content getContentById(UUID id);

    Content updateContent(UUID id, Content content);

    void deleteContent(UUID id);
}
