package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.ContentRequestDTO;
import com.geeknito.geeknito_backend.course.dto.ContentResponseDTO;

import java.util.List;

public interface ContentAdminService {

    ContentResponseDTO createContent(Long submoduleId, ContentRequestDTO dto);

    ContentResponseDTO updateContent(Long contentId, ContentRequestDTO dto);

    void deleteContent(Long contentId);

    List<ContentResponseDTO> getContentBySubmodule(Long submoduleId);
}
