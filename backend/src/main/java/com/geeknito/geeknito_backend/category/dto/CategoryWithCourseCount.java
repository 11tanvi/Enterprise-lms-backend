package com.geeknito.geeknito_backend.category.dto;

import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;

public interface CategoryWithCourseCount {
    CategoryEntity getCategory();
    Long getCourseCount();
}
