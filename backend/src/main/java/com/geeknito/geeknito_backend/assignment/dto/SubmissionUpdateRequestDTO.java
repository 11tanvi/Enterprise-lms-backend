package com.geeknito.geeknito_backend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionUpdateRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String status; // SubmissionStatus (e.g. SUBMITTED, UNDER_REVIEW, GRADED)
    private Integer obtainedMarks;
    private BigDecimal percentage;
    private Integer timeTakenMinutes;
    private List<StudentAnswerUpdateRequestDTO> answers;
}
