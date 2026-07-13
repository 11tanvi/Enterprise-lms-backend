package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.CourseRequestDTO;
import com.geeknito.geeknito_backend.course.dto.CourseResponseDTO;

import java.util.List;

public interface CourseAdminService {

    CourseResponseDTO create(CourseRequestDTO requestDTO);

    CourseResponseDTO update(Long id, CourseRequestDTO requestDTO);

    void softDelete(Long id);

    void hardDelete(Long id);

    CourseResponseDTO getById(Long id);

    List<CourseResponseDTO> getAll();
}
