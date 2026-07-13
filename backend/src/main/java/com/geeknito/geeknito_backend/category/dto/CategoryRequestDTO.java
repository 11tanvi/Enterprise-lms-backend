package com.geeknito.geeknito_backend.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequestDTO {

    @NotBlank(message = "Category name is required and cannot be empty")
    private String name;
    private String icon;
    private String description;
    private String color;
    
    @JsonProperty("isActive")
    private Boolean Active;
}
