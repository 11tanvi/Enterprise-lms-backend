package com.geeknito.geeknito_backend.assignment.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;

public interface ExportService {
    ByteArrayInputStream exportAssignmentResults(Long assignmentId) throws IOException;
    ByteArrayInputStream exportBatchStudents(Long batchId) throws IOException;
}
