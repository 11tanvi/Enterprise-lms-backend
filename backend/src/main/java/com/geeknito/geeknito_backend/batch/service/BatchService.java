package com.geeknito.geeknito_backend.batch.service;

import com.geeknito.geeknito_backend.batch.dto.BatchCreateRequestDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchUpdateRequestDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentResponseDTO;
import com.geeknito.geeknito_backend.batch.dto.BatchStudentListResponseDTO;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;

import java.util.List;

public interface BatchService {
    BatchResponseDTO createBatch(BatchCreateRequestDTO request);
    BatchResponseDTO updateBatch(Long id, BatchUpdateRequestDTO request);
    void deleteBatch(Long id);
    BatchResponseDTO getBatch(Long id);
    List<BatchResponseDTO> getBatchesByCourse(Long courseId);
    List<BatchResponseDTO> getMyBatchesForUser(UserEntity user);
    BatchStudentResponseDTO addStudentToBatch(Long batchId, Long studentId);
    void removeStudentFromBatch(Long batchId, Long studentId);
    List<BatchStudentListResponseDTO> getStudentsInBatch(Long batchId);
    List<BatchResponseDTO> getBatchesForStudent(Long studentId);
    BatchResponseDTO getBatchForStudent(Long studentId, Long batchId);
}
