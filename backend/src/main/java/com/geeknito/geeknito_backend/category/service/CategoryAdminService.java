package com.geeknito.geeknito_backend.category.service;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;

import java.util.List;

public interface CategoryAdminService {

    CategoryResponseDTO create(CategoryRequestDTO requestDTO);

    CategoryResponseDTO getById(Long id);

    List<CategoryResponseDTO> getAll();

    CategoryResponseDTO update(Long id, CategoryRequestDTO requestDTO);

    void softDelete(Long id);
}
