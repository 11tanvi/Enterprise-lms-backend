package com.geeknito.geeknito_backend.category.mapper;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;
import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface CategoryMapper {

    CategoryMapper INSTANCE = Mappers.getMapper(CategoryMapper.class);

    CategoryEntity toEntity(CategoryRequestDTO dto);

    CategoryResponseDTO toResponseDTO(CategoryEntity entity);

    void updateEntityFromDto(CategoryRequestDTO dto, @MappingTarget CategoryEntity entity);
}
