package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.ModuleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.ModuleResponseDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleRequestDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleResponseDTO;

import java.util.List;

public interface CurriculumAdminService {

    ModuleResponseDTO createModule(Long courseId, ModuleRequestDTO requestDTO);

    SubmoduleResponseDTO createSubmodule(Long moduleId, SubmoduleRequestDTO requestDTO);

    List<ModuleResponseDTO> getCourseCurriculum(Long courseId);
}
