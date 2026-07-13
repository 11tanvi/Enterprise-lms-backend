package com.geeknito.geeknito_backend.batch.dto;

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
public class BatchResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String batchCode;
    private Long courseId;
    private String courseTitle;
    private Long teacherId;
    private String teacherName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean isActive;
    private int studentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
