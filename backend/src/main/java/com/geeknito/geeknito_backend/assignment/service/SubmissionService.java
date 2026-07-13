package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.SubmissionCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.SubmissionUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.SubmissionResponseDTO;
import com.geeknito.geeknito_backend.assignment.dto.SubmissionSummaryResponseDTO;

import java.util.List;

public interface SubmissionService {
    SubmissionResponseDTO startSubmission(SubmissionCreateRequestDTO request);
    SubmissionResponseDTO saveDraft(Long id, SubmissionUpdateRequestDTO request);
    SubmissionResponseDTO submitAssignment(Long id, SubmissionUpdateRequestDTO request);
    SubmissionResponseDTO gradeSubmission(Long id, SubmissionUpdateRequestDTO request);
    SubmissionResponseDTO getSubmission(Long id);
    List<SubmissionResponseDTO> getSubmissionsByAssignment(Long assignmentId);
    List<SubmissionResponseDTO> getSubmissionsByStudent(Long studentId);
    SubmissionResponseDTO getSubmissionByAssignmentAndStudent(Long assignmentId, Long studentId);
    List<SubmissionResponseDTO> getAllSubmissions();
}
