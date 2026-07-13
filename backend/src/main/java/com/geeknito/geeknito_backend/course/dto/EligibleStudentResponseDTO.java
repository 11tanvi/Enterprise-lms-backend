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
public class EligibleStudentResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String fullName;
    private String email;
    private List<Long> courseIds;
    private List<String> courseTitles;
}
