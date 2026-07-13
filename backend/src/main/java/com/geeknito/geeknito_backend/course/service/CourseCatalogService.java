package com.geeknito.geeknito_backend.course.service;

import com.geeknito.geeknito_backend.course.dto.CourseCatalogCardDTO;
import com.geeknito.geeknito_backend.course.dto.CourseCatalogDetailDTO;
import com.geeknito.geeknito_backend.course.dto.CourseResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface CourseCatalogService {
    
    Page<CourseCatalogCardDTO> getCatalogCourses(Pageable pageable);

    CourseCatalogDetailDTO getCourseDetailBySlug(String slug);

    List<CourseResponseDTO> getActiveCourses();
}
