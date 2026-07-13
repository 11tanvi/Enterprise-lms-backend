package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.AssignmentCreateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentUpdateRequestDTO;
import com.geeknito.geeknito_backend.assignment.dto.AssignmentResponseDTO;

import java.util.List;

public interface AssignmentService {
    AssignmentResponseDTO createAssignment(AssignmentCreateRequestDTO request);
    AssignmentResponseDTO updateAssignment(Long id, AssignmentUpdateRequestDTO request);
    void deleteAssignment(Long id);
    AssignmentResponseDTO publishAssignment(Long id);
    AssignmentResponseDTO archiveAssignment(Long id);
    AssignmentResponseDTO getAssignment(Long id);
    List<AssignmentResponseDTO> getAssignmentsByCourse(Long courseId);
    List<AssignmentResponseDTO> getAssignmentsByTeacher(Long teacherId);
    List<AssignmentResponseDTO> getAllAssignments();
    List<AssignmentResponseDTO> getAssignmentsForStudent(Long studentId);
}
