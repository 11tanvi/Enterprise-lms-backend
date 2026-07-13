package com.geeknito.geeknito_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String title;
    private String description;
    private Integer moduleOrder;
}
