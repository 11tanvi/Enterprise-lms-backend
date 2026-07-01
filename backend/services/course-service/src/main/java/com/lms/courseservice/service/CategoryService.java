package com.lms.courseservice.service;

import com.lms.courseservice.entity.Category;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    Category createCategory(Category category);

    List<Category> getAllCategories();

    Category getCategoryById(UUID id);

    Category updateCategory(UUID id, Category category);

    void deleteCategory(UUID id);
}