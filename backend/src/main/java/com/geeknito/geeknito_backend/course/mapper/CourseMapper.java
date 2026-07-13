package com.geeknito.geeknito_backend.course.mapper;

import com.geeknito.geeknito_backend.course.dto.CourseCatalogCardDTO;
import com.geeknito.geeknito_backend.course.dto.CourseCatalogDetailDTO;
import com.geeknito.geeknito_backend.course.dto.ModuleResponseDTO;
import com.geeknito.geeknito_backend.course.dto.SubmoduleResponseDTO;
import com.geeknito.geeknito_backend.entity.learning.CourseEntity;
import com.geeknito.geeknito_backend.entity.learning.ModuleEntity;
import com.geeknito.geeknito_backend.entity.learning.SubmoduleEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface CourseMapper {

    CourseMapper INSTANCE = Mappers.getMapper(CourseMapper.class);

    CourseCatalogCardDTO toCatalogCardDTO(CourseEntity entity);

    CourseCatalogDetailDTO toCatalogDetailDTO(CourseEntity entity);

    ModuleResponseDTO toModuleResponseDTO(ModuleEntity entity);

    SubmoduleResponseDTO toSubmoduleResponseDTO(SubmoduleEntity entity);
}
