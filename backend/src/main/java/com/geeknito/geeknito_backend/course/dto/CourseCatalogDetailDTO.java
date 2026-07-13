package com.geeknito.geeknito_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseCatalogDetailDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String slug;
    private String thumbnail;
    private String shortDescription;
    private String description;
    private String level;
    private String duration;
    private boolean isActive;
    private List<ModuleResponseDTO> modules;
}
