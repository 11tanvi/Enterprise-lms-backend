package com.geeknito.geeknito_backend.assignment.service;

import com.geeknito.geeknito_backend.assignment.dto.AssignmentExportRow;
import com.geeknito.geeknito_backend.assignment.dto.BatchStudentExportRow;
import com.geeknito.geeknito_backend.assignment.repository.AssignmentRepository;
import com.geeknito.geeknito_backend.assignment.repository.SubmissionRepository;
import com.geeknito.geeknito_backend.assignment.util.ExcelGenerator;
import com.geeknito.geeknito_backend.batch.repository.BatchRepository;
import com.geeknito.geeknito_backend.entity.learning.*;
import com.geeknito.geeknito_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final BatchRepository batchRepository;

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportAssignmentResults(Long assignmentId) throws IOException {
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        List<AssignmentExportRow> rows = new ArrayList<>();
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // Iterate through all batches assigned to this assignment
        for (AssignmentBatchEntity assignmentBatch : assignment.getAssignmentBatches()) {
            BatchEntity batch = assignmentBatch.getBatch();

            // Iterate through all students in this batch
            for (BatchStudentEntity batchStudent : batch.getStudents()) {
                UserEntity student = batchStudent.getStudent();

                // Fetch all submissions for this student and assignment
                List<SubmissionEntity> submissions = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId());

                AssignmentExportRow row;
                String rollNo = "ROLL-" + String.format("%05d", student.getId());

                if (submissions == null || submissions.isEmpty()) {
                    // No submissions yet
                    row = AssignmentExportRow.builder()
                            .rollNumber(rollNo)
                            .studentName(student.getFullName())
                            .email(student.getEmail())
                            .assignmentName(assignment.getTitle())
                            .batchName(batch.getName())
                            .score("N/A")
                            .percentage("N/A")
                            .grade("N/A")
                            .submissionStatus("Not Started")
                            .numberOfAttempts(0)
                            .lateSubmission("No")
                            .certificateIssued("No")
                            .submittedAt("-")
                            .build();
                } else {
                    int totalAttempts = submissions.size();

                    // Find best submission (highest score, prioritizing GRADED/SUBMITTED, or latest)
                    SubmissionEntity best = submissions.stream()
                            .max((s1, s2) -> {
                                Integer m1 = s1.getObtainedMarks() != null ? s1.getObtainedMarks() : 0;
                                Integer m2 = s2.getObtainedMarks() != null ? s2.getObtainedMarks() : 0;
                                int comp = m1.compareTo(m2);
                                if (comp != 0) return comp;

                                if (s1.getSubmittedAt() != null && s2.getSubmittedAt() != null) {
                                    return s1.getSubmittedAt().compareTo(s2.getSubmittedAt());
                                }
                                return s1.getId().compareTo(s2.getId());
                            })
                            .orElse(submissions.get(0));

                    // Score formatting
                    String scoreStr = best.getObtainedMarks() != null ? String.valueOf(best.getObtainedMarks()) : "N/A";

                    // Percentage formatting
                    String pctStr = "N/A";
                    double pctValue = 0.0;
                    if (best.getPercentage() != null) {
                        pctValue = best.getPercentage().doubleValue();
                        pctStr = String.format("%.2f%%", pctValue);
                    } else if (best.getObtainedMarks() != null && assignment.getMaxMarks() > 0) {
                        pctValue = (best.getObtainedMarks() * 100.0) / assignment.getMaxMarks();
                        pctStr = String.format("%.2f%%", pctValue);
                    }

                    // Grade calculation
                    String grade = "N/A";
                    if (best.getStatus() == SubmissionStatus.GRADED) {
                        if (pctValue >= 90.0) grade = "A";
                        else if (pctValue >= 80.0) grade = "B";
                        else if (pctValue >= 70.0) grade = "C";
                        else if (pctValue >= 60.0) grade = "D";
                        else grade = "F";
                    }

                    // Status string
                    String statusText = "In Progress";
                    if (best.getStatus() == SubmissionStatus.GRADED) {
                        statusText = "Graded";
                    } else if (best.getStatus() == SubmissionStatus.SUBMITTED) {
                        statusText = "Submitted";
                    } else if (best.getStatus() == SubmissionStatus.LATE_SUBMITTED) {
                        statusText = "Late Submitted";
                    } else if (best.getStatus() == SubmissionStatus.UNDER_REVIEW) {
                        statusText = "Under Review";
                    }

                    // Late submission check
                    String isLate = (best.isLateSubmission() || best.getStatus() == SubmissionStatus.LATE_SUBMITTED) ? "Yes" : "No";

                    // Certificate Issued check
                    boolean isCertEligible = assignment.isEnableCertificates()
                            && best.getStatus() == SubmissionStatus.GRADED
                            && best.getObtainedMarks() != null
                            && best.getObtainedMarks() >= assignment.getPassingMarks();
                    String certIssued = isCertEligible ? "Yes" : "No";

                    // Date submitted
                    String subDateStr = "-";
                    if (best.getSubmittedAt() != null) {
                        subDateStr = best.getSubmittedAt().format(dateTimeFormatter);
                    }

                    row = AssignmentExportRow.builder()
                            .rollNumber(rollNo)
                            .studentName(student.getFullName())
                            .email(student.getEmail())
                            .assignmentName(assignment.getTitle())
                            .batchName(batch.getName())
                            .score(scoreStr)
                            .percentage(pctStr)
                            .grade(grade)
                            .submissionStatus(statusText)
                            .numberOfAttempts(totalAttempts)
                            .lateSubmission(isLate)
                            .certificateIssued(certIssued)
                            .submittedAt(subDateStr)
                            .build();
                }
                rows.add(row);
            }
        }

        return ExcelGenerator.generateAssignmentExport(assignment, rows);
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayInputStream exportBatchStudents(Long batchId) throws IOException {
        BatchEntity batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + batchId));

        List<BatchStudentExportRow> rows = new ArrayList<>();
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (BatchStudentEntity batchStudent : batch.getStudents()) {
            UserEntity student = batchStudent.getStudent();
            if (student == null) {
                continue;
            }

            String rollNo = "ROLL-" + String.format("%05d", student.getId());
            String enrolledDateStr = "-";
            if (batchStudent.getEnrolledAt() != null) {
                enrolledDateStr = batchStudent.getEnrolledAt().format(dateTimeFormatter);
            }

            long days = 0;
            if (batchStudent.getEnrolledAt() != null) {
                days = java.time.temporal.ChronoUnit.DAYS.between(batchStudent.getEnrolledAt(), LocalDateTime.now());
            }

            BatchStudentExportRow row = BatchStudentExportRow.builder()
                    .studentId(String.valueOf(student.getId()))
                    .rollNumber(rollNo)
                    .fullName(student.getFullName())
                    .email(student.getEmail())
                    .batchName(batch.getName())
                    .courseTitle(batch.getCourse() != null ? batch.getCourse().getTitle() : "N/A")
                    .enrollmentDate(enrolledDateStr)
                    .enrollmentStatus(batchStudent.getStatus() != null ? batchStudent.getStatus().name() : "N/A")
                    .userStatus(student.isActive() ? "Active" : "Inactive")
                    .joinedDaysAgo(String.valueOf(Math.max(0, days)))
                    .build();

            rows.add(row);
        }

        String generatedBy = "System";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserEntity) {
                generatedBy = ((UserEntity) principal).getFullName();
            }
        }

        return ExcelGenerator.generateBatchStudents(batch, rows, generatedBy);
    }
}
