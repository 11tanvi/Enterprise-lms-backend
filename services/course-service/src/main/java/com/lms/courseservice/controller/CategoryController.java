package com.lms.courseservice.controller;

import com.lms.courseservice.entity.Category;
import com.lms.courseservice.service.CategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public Category create(@RequestBody Category category) {
        return categoryService.createCategory(category);
    }

    @GetMapping
    public List<Category> getAll() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public Category getById(@PathVariable UUID id) {
        return categoryService.getCategoryById(id);
    }

    @PutMapping("/{id}")
    public Category update(@PathVariable UUID id,
                           @RequestBody Category category) {
        return categoryService.updateCategory(id, category);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return "Category deleted successfully";
    }
}