package com.geeknito.geeknito_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "Course ID is required.")
    private Long courseId;
}
