package com.geeknito.geeknito_backend.category.service;

import com.geeknito.geeknito_backend.category.dto.CategoryRequestDTO;
import com.geeknito.geeknito_backend.category.dto.CategoryResponseDTO;

import java.util.List;

public interface CategoryService {
    
    CategoryResponseDTO createCategory(CategoryRequestDTO requestDTO);
    
    CategoryResponseDTO getCategoryById(Long id);
    
    List<CategoryResponseDTO> getAllActiveCategories();
    
    CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO requestDTO);
    
    void deleteCategory(Long id);
}
