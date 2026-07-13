package com.geeknito.geeknito_backend.batch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class BatchCreateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Batch name is required")
    @Size(min = 2, max = 100, message = "Batch name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Batch code is required")
    @Size(min = 3, max = 50, message = "Batch code must be between 3 and 50 characters")
    private String batchCode;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @Builder.Default
    private Boolean isActive = true;
}
