package com.geeknito.geeknito_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String type;
    private String text;
    private String code;
    private String language;
    private String videoUrl;
    private String imageUrl;
    private String fileUrl;
    private String fileName;
    private String alt;
    private String caption;
    private Integer headingLevel;
    private Integer contentOrder;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}